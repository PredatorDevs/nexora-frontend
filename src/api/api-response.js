import { ApiError } from '@/api/api-error.js';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeApiResponse(response) {
  if (response?.status === 204) {
    const requestId =
      response.headers?.get?.('x-request-id') ??
      response.headers?.['x-request-id'] ??
      null;
    return Object.freeze({
      data: null,
      meta: Object.freeze({ requestId }),
      status: response.status,
      headers: response.headers,
    });
  }

  const envelope = response?.data;

  if (
    !isObject(envelope) ||
    envelope.success !== true ||
    !Object.hasOwn(envelope, 'data') ||
    !isObject(envelope.meta)
  ) {
    throw new ApiError({
      code: 'INVALID_API_RESPONSE',
      message: 'El servidor devolvió una respuesta no válida.',
      status: response?.status ?? null,
      requestId: envelope?.meta?.requestId ?? null,
    });
  }

  return Object.freeze({
    data: envelope.data,
    meta: Object.freeze({ ...envelope.meta }),
    status: response.status,
    headers: response.headers,
  });
}
