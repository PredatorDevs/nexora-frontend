import { describe, expect, it } from 'vitest';

import { createAccessTokenStore } from '@/api/access-token-store.js';

describe('accessTokenStore', () => {
  it('mantiene el token solo en memoria y permite limpiarlo', () => {
    const store = createAccessTokenStore();

    expect(store.get()).toBeNull();
    store.set('access-token');
    expect(store.get()).toBe('access-token');
    store.clear();
    expect(store.get()).toBeNull();
  });

  it.each([null, undefined, '', '   ', 123])(
    'rechaza el token inválido %j',
    (token) => {
      const store = createAccessTokenStore();

      expect(() => store.set(token)).toThrow(TypeError);
    },
  );
});
