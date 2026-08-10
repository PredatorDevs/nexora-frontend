import axios from 'axios';

const fallbackMessages = Object.freeze({
  REQUEST_CANCELED: 'La solicitud fue cancelada.',
  REQUEST_TIMEOUT: 'La solicitud tardó demasiado tiempo.',
  NETWORK_ERROR: 'No fue posible conectar con el servidor.',
  INVALID_API_RESPONSE: 'El servidor devolvió una respuesta no válida.',
  HTTP_ERROR: 'No fue posible completar la solicitud.',
});

export class ApiError extends Error {
  constructor({
    code,
    message,
    status = null,
    details,
    requestId = null,
    cause,
  }) {
    super(message, { cause });
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

function responseRequestId(response) {
  return (
    response?.data?.meta?.requestId ??
    response?.headers?.['x-request-id'] ??
    null
  );
}

export function toApiError(error) {
  if (error instanceof ApiError) return error;

  if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
    return new ApiError({
      code: 'REQUEST_CANCELED',
      message: fallbackMessages.REQUEST_CANCELED,
      cause: error,
    });
  }

  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return new ApiError({
      code: 'REQUEST_TIMEOUT',
      message: fallbackMessages.REQUEST_TIMEOUT,
      cause: error,
    });
  }

  if (axios.isAxiosError(error)) {
    const response = error.response;
    const backendError = response?.data?.error;
    const staleWrite = backendError?.details?.reason === 'STALE_WRITE';

    if (!response) {
      return new ApiError({
        code: 'NETWORK_ERROR',
        message: fallbackMessages.NETWORK_ERROR,
        cause: error,
      });
    }

    return new ApiError({
      code: backendError?.code ?? 'HTTP_ERROR',
      message: staleWrite
        ? 'El registro cambió mientras lo editabas. Recarga los datos e inténtalo nuevamente.'
        : (backendError?.message ?? fallbackMessages.HTTP_ERROR),
      status: response.status,
      details: backendError?.details,
      requestId: responseRequestId(response),
      cause: error,
    });
  }

  return new ApiError({
    code: 'UNKNOWN_ERROR',
    message: fallbackMessages.HTTP_ERROR,
    cause: error,
  });
}
