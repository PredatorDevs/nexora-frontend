import axios from 'axios';
import { describe, expect, it } from 'vitest';

import { ApiError, toApiError } from '@/api/api-error.js';

describe('toApiError', () => {
  it('conserva el error público del backend', () => {
    const source = new axios.AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      {},
      {},
      {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'The request contains invalid data.',
            details: [{ location: 'body', path: 'email', message: 'Invalid' }],
          },
          meta: { requestId: 'request-2' },
        },
        headers: {},
        config: {},
        statusText: 'Bad Request',
      },
    );

    expect(toApiError(source)).toMatchObject({
      name: 'ApiError',
      code: 'VALIDATION_ERROR',
      status: 400,
      requestId: 'request-2',
      details: [{ location: 'body', path: 'email', message: 'Invalid' }],
    });
  });

  it('normaliza timeout, red y cancelación', () => {
    const timeout = new axios.AxiosError('timeout', 'ECONNABORTED');
    const network = new axios.AxiosError('network', 'ERR_NETWORK');
    const canceled = new axios.CanceledError();

    expect(toApiError(timeout).code).toBe('REQUEST_TIMEOUT');
    expect(toApiError(network).code).toBe('NETWORK_ERROR');
    expect(toApiError(canceled).code).toBe('REQUEST_CANCELED');
  });

  it('no envuelve dos veces una instancia de ApiError', () => {
    const error = new ApiError({ code: 'KNOWN', message: 'Known error' });
    expect(toApiError(error)).toBe(error);
  });
});
