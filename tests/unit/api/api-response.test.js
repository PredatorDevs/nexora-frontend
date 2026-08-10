import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/api-error.js';
import { normalizeApiResponse } from '@/api/api-response.js';

describe('normalizeApiResponse', () => {
  it('preserva datos, metadatos y estado HTTP', () => {
    const response = normalizeApiResponse({
      status: 200,
      headers: { 'x-request-id': 'request-1' },
      data: {
        success: true,
        data: [{ id: 1 }],
        meta: {
          requestId: 'request-1',
          pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
        },
      },
    });

    expect(response.data).toEqual([{ id: 1 }]);
    expect(response.meta.pagination.total).toBe(1);
    expect(response.status).toBe(200);
  });

  it('acepta respuestas 204 sin envelope', () => {
    const response = normalizeApiResponse({
      status: 204,
      headers: { 'x-request-id': 'request-2' },
      data: '',
    });

    expect(response.data).toBeNull();
    expect(response.meta.requestId).toBe('request-2');
    expect(response.status).toBe(204);
  });

  it.each([
    null,
    {},
    { success: false, data: null, meta: {} },
    { success: true, meta: {} },
    { success: true, data: null, meta: null },
  ])('rechaza el envelope inválido %j', (data) => {
    expect(() => normalizeApiResponse({ status: 200, data })).toThrowError(
      ApiError,
    );
  });
});
