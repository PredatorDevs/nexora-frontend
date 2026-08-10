import axios from 'axios';

import { accessTokenStore } from '@/api/access-token-store.js';
import { ApiError, toApiError } from '@/api/api-error.js';
import { normalizeApiResponse } from '@/api/api-response.js';
import { environment } from '@/config/environment.js';

const REFRESH_PATH = '/auth/refresh';
const AUTH_PATHS_WITHOUT_REFRESH = new Set(['/auth/login', REFRESH_PATH]);

function requestPath(config) {
  try {
    return new URL(config.url, 'http://local.invalid').pathname.replace(
      /^\/api\/v1/,
      '',
    );
  } catch {
    return config.url;
  }
}

function validRefreshPayload(response) {
  const normalized = normalizeApiResponse(response);
  const accessToken = normalized.data?.accessToken;

  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new ApiError({
      code: 'INVALID_API_RESPONSE',
      message: 'La renovación de sesión devolvió una respuesta no válida.',
      status: normalized.status,
      requestId: normalized.meta.requestId ?? null,
    });
  }

  return accessToken;
}

export function createApiClient({
  baseURL = environment.apiBaseUrl,
  timeout = environment.requestTimeout,
  tokenStore = accessTokenStore,
} = {}) {
  const transport = axios.create({
    baseURL,
    timeout,
    withCredentials: true,
    headers: { Accept: 'application/json' },
  });
  const refreshTransport = axios.create({
    baseURL,
    timeout,
    withCredentials: true,
    headers: { Accept: 'application/json' },
  });

  let refreshPromise = null;
  let sessionExpiredHandler = null;

  async function notifySessionExpired(error) {
    if (!sessionExpiredHandler) return;

    try {
      await sessionExpiredHandler(error);
    } catch {
      // Session cleanup must never replace the original HTTP error.
    }
  }

  function refreshAccessToken() {
    if (!refreshPromise) {
      refreshPromise = refreshTransport
        .post(REFRESH_PATH)
        .then(validRefreshPayload)
        .then((accessToken) => {
          tokenStore.set(accessToken);
          return accessToken;
        })
        .catch(async (error) => {
          const apiError = toApiError(error);
          tokenStore.clear();
          await notifySessionExpired(apiError);
          throw apiError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    return refreshPromise;
  }

  transport.interceptors.request.use((config) => {
    const accessToken = tokenStore.get();
    config.accessTokenAtRequest = accessToken;
    if (accessToken)
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    return config;
  });

  transport.interceptors.response.use(normalizeApiResponse, async (error) => {
    const config = error.config;
    const shouldRefresh =
      error.response?.status === 401 &&
      config &&
      !config.skipAuthRefresh &&
      !config.authRetryAttempted &&
      !AUTH_PATHS_WITHOUT_REFRESH.has(requestPath(config));

    if (!shouldRefresh) throw toApiError(error);

    config.authRetryAttempted = true;
    const currentAccessToken = tokenStore.get();
    if (
      currentAccessToken &&
      currentAccessToken !== config.accessTokenAtRequest
    ) {
      return transport.request(config);
    }

    await refreshAccessToken();
    return transport.request(config);
  });

  return Object.freeze({
    request(config) {
      return transport.request(config);
    },
    get(url, config) {
      return transport.get(url, config);
    },
    post(url, data, config) {
      return transport.post(url, data, config);
    },
    put(url, data, config) {
      return transport.put(url, data, config);
    },
    patch(url, data, config) {
      return transport.patch(url, data, config);
    },
    delete(url, config) {
      return transport.delete(url, config);
    },
    refreshSession() {
      return refreshAccessToken();
    },
    setSessionExpiredHandler(handler) {
      if (handler !== null && typeof handler !== 'function') {
        throw new TypeError(
          'El manejador de sesión debe ser una función o null.',
        );
      }
      sessionExpiredHandler = handler;
    },
    clearSession() {
      tokenStore.clear();
    },
  });
}

export const apiClient = createApiClient();
