export function createAccessTokenStore() {
  let accessToken = null;

  return Object.freeze({
    get() {
      return accessToken;
    },
    set(nextAccessToken) {
      if (typeof nextAccessToken !== 'string' || !nextAccessToken.trim()) {
        throw new TypeError('El access token debe ser un texto no vacío.');
      }

      accessToken = nextAccessToken;
    },
    clear() {
      accessToken = null;
    },
  });
}

export const accessTokenStore = createAccessTokenStore();
