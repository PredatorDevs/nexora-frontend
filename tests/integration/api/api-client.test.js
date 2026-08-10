import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { createAccessTokenStore } from '@/api/access-token-store.js';
import { ApiError } from '@/api/api-error.js';
import { createApiClient } from '@/api/api-client.js';

const apiBaseUrl = 'https://api.example.test/api/v1';
const server = setupServer();

function success(
  data,
  { status = 200, requestId = 'request-ok', meta = {} } = {},
) {
  return HttpResponse.json(
    { success: true, data, meta: { ...meta, requestId } },
    { status },
  );
}

function failure({
  code,
  message = 'Request failed.',
  status,
  requestId = 'request-error',
  details,
}) {
  return HttpResponse.json(
    {
      success: false,
      error: { code, message, ...(details === undefined ? {} : { details }) },
      meta: { requestId },
    },
    { status },
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('apiClient', () => {
  it('envía el Bearer token y normaliza la respuesta', async () => {
    const tokenStore = createAccessTokenStore();
    tokenStore.set('current-token');
    server.use(
      http.get(`${apiBaseUrl}/users`, ({ request }) => {
        expect(request.headers.get('authorization')).toBe(
          'Bearer current-token',
        );
        return success([{ id: 1 }], {
          meta: {
            pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
          },
        });
      }),
    );

    const response = await createApiClient({
      baseURL: apiBaseUrl,
      tokenStore,
    }).get('/users');

    expect(response.data).toEqual([{ id: 1 }]);
    expect(response.meta.pagination.total).toBe(1);
  });

  it('convierte la validación del backend en ApiError', async () => {
    const details = [
      {
        location: 'body',
        path: 'email',
        message: 'Invalid email',
        code: 'invalid_format',
      },
    ];
    server.use(
      http.post(`${apiBaseUrl}/users`, () =>
        failure({ code: 'VALIDATION_ERROR', status: 400, details }),
      ),
    );

    const promise = createApiClient({ baseURL: apiBaseUrl }).post('/users', {});

    await expect(promise).rejects.toMatchObject({
      name: 'ApiError',
      code: 'VALIDATION_ERROR',
      status: 400,
      details,
      requestId: 'request-error',
    });
  });

  it('no intenta refresh después de un 403', async () => {
    let refreshCount = 0;
    server.use(
      http.get(`${apiBaseUrl}/users`, () =>
        failure({ code: 'FORBIDDEN', status: 403 }),
      ),
      http.post(`${apiBaseUrl}/auth/refresh`, () => {
        refreshCount += 1;
        return success({ accessToken: 'unused-token' });
      }),
    );

    await expect(
      createApiClient({ baseURL: apiBaseUrl }).get('/users'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
    expect(refreshCount).toBe(0);
  });

  it('comparte un único refresh y reintenta solicitudes concurrentes', async () => {
    const tokenStore = createAccessTokenStore();
    tokenStore.set('expired-token');
    let refreshCount = 0;
    let protectedCount = 0;

    server.use(
      http.get(`${apiBaseUrl}/protected`, ({ request }) => {
        protectedCount += 1;
        if (request.headers.get('authorization') !== 'Bearer renewed-token') {
          return failure({ code: 'AUTHENTICATION_REQUIRED', status: 401 });
        }
        return success({ protected: true });
      }),
      http.post(`${apiBaseUrl}/auth/refresh`, () => {
        refreshCount += 1;
        return success({ accessToken: 'renewed-token' });
      }),
    );

    const client = createApiClient({ baseURL: apiBaseUrl, tokenStore });
    const responses = await Promise.all([
      client.get('/protected'),
      client.get('/protected'),
      client.get('/protected'),
    ]);

    expect(responses.map(({ data }) => data)).toEqual([
      { protected: true },
      { protected: true },
      { protected: true },
    ]);
    expect(refreshCount).toBe(1);
    expect(protectedCount).toBe(6);
    expect(tokenStore.get()).toBe('renewed-token');
  });

  it('limpia la sesión una sola vez cuando falla el refresh compartido', async () => {
    const tokenStore = createAccessTokenStore();
    tokenStore.set('expired-token');
    const onSessionExpired = vi.fn();
    let refreshCount = 0;

    server.use(
      http.get(`${apiBaseUrl}/protected`, () =>
        failure({ code: 'AUTHENTICATION_REQUIRED', status: 401 }),
      ),
      http.post(`${apiBaseUrl}/auth/refresh`, () => {
        refreshCount += 1;
        return failure({ code: 'SESSION_EXPIRED', status: 401 });
      }),
    );

    const client = createApiClient({ baseURL: apiBaseUrl, tokenStore });
    client.setSessionExpiredHandler(onSessionExpired);
    const results = await Promise.allSettled([
      client.get('/protected'),
      client.get('/protected'),
    ]);

    expect(results.every(({ status }) => status === 'rejected')).toBe(true);
    for (const result of results) {
      expect(result.reason).toBeInstanceOf(ApiError);
      expect(result.reason.code).toBe('SESSION_EXPIRED');
    }
    expect(refreshCount).toBe(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(tokenStore.get()).toBeNull();
  });

  it('no vuelve a renovar cuando el reintento continúa recibiendo 401', async () => {
    const tokenStore = createAccessTokenStore();
    tokenStore.set('expired-token');
    let refreshCount = 0;
    let protectedCount = 0;

    server.use(
      http.get(`${apiBaseUrl}/always-unauthorized`, () => {
        protectedCount += 1;
        return failure({ code: 'AUTHENTICATION_REQUIRED', status: 401 });
      }),
      http.post(`${apiBaseUrl}/auth/refresh`, () => {
        refreshCount += 1;
        return success({ accessToken: 'renewed-token' });
      }),
    );

    await expect(
      createApiClient({ baseURL: apiBaseUrl, tokenStore }).get(
        '/always-unauthorized',
      ),
    ).rejects.toMatchObject({ code: 'AUTHENTICATION_REQUIRED' });
    expect(refreshCount).toBe(1);
    expect(protectedCount).toBe(2);
  });

  it('no intenta refresh cuando el login devuelve 401', async () => {
    let refreshCount = 0;
    server.use(
      http.post(`${apiBaseUrl}/auth/login`, () =>
        failure({ code: 'INVALID_CREDENTIALS', status: 401 }),
      ),
      http.post(`${apiBaseUrl}/auth/refresh`, () => {
        refreshCount += 1;
        return success({ accessToken: 'unused-token' });
      }),
    );

    await expect(
      createApiClient({ baseURL: apiBaseUrl }).post('/auth/login', {
        email: 'user@example.test',
        password: 'incorrect',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(refreshCount).toBe(0);
  });

  it('permite omitir refresh explícitamente', async () => {
    let refreshCount = 0;
    server.use(
      http.get(`${apiBaseUrl}/optional`, () =>
        failure({ code: 'AUTHENTICATION_REQUIRED', status: 401 }),
      ),
      http.post(`${apiBaseUrl}/auth/refresh`, () => {
        refreshCount += 1;
        return success({ accessToken: 'unused-token' });
      }),
    );

    await expect(
      createApiClient({ baseURL: apiBaseUrl }).get('/optional', {
        skipAuthRefresh: true,
      }),
    ).rejects.toMatchObject({ code: 'AUTHENTICATION_REQUIRED' });
    expect(refreshCount).toBe(0);
  });
});
