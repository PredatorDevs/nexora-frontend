import { describe, expect, it } from 'vitest';

import { parseEnvironment } from '@/config/environment-schema.js';

const validSource = {
  VITE_APP_NAME: 'Predator Admin',
  VITE_API_BASE_URL: '/api/v1',
  VITE_REQUEST_TIMEOUT: '15000',
  VITE_ENABLE_AUDIT_MODULE: 'true',
};

describe('parseEnvironment', () => {
  it('normaliza una configuración válida', () => {
    expect(
      parseEnvironment({
        ...validSource,
        VITE_APP_NAME: '  Predator Admin  ',
        VITE_API_BASE_URL: '/api/v1/',
      }),
    ).toEqual({
      appName: 'Predator Admin',
      apiBaseUrl: '/api/v1',
      requestTimeout: 15000,
      enableAuditModule: true,
    });
  });

  it('admite una URL HTTP(S) absoluta', () => {
    const result = parseEnvironment({
      ...validSource,
      VITE_API_BASE_URL: 'https://api.example.com/api/v1/',
    });

    expect(result.apiBaseUrl).toBe('https://api.example.com/api/v1');
  });

  it('rechaza variables obligatorias ausentes', () => {
    expect(() => parseEnvironment({})).toThrow(
      /VITE_APP_NAME.*VITE_API_BASE_URL.*VITE_REQUEST_TIMEOUT.*VITE_ENABLE_AUDIT_MODULE/,
    );
  });

  it.each(['yes', '1', 'TRUE', ''])(
    'rechaza el booleano inválido %j',
    (value) => {
      expect(() =>
        parseEnvironment({
          ...validSource,
          VITE_ENABLE_AUDIT_MODULE: value,
        }),
      ).toThrow(/VITE_ENABLE_AUDIT_MODULE/);
    },
  );

  it.each(['999', '120001', '1.5', 'not-a-number'])(
    'rechaza el timeout inválido %j',
    (value) => {
      expect(() =>
        parseEnvironment({
          ...validSource,
          VITE_REQUEST_TIMEOUT: value,
        }),
      ).toThrow(/VITE_REQUEST_TIMEOUT/);
    },
  );

  it.each(['api/v1', '//example.com/api', 'ftp://example.com/api', '/api?v=1'])(
    'rechaza la URL base inválida %j',
    (value) => {
      expect(() =>
        parseEnvironment({ ...validSource, VITE_API_BASE_URL: value }),
      ).toThrow(/VITE_API_BASE_URL/);
    },
  );

  it('devuelve una configuración inmutable', () => {
    expect(Object.isFrozen(parseEnvironment(validSource))).toBe(true);
  });
});
