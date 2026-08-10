import { accessTokenStore } from '@/api/access-token-store.js';
import { apiClient } from '@/api/api-client.js';
import { ApiError } from '@/api/api-error.js';
import {
  authenticatedUserSchema,
  loginResponseSchema,
  permissionsResponseSchema,
  changePasswordResponseSchema,
} from '@/modules/auth/auth.schemas.js';

function parseResponse(schema, response, message) {
  const result = schema.safeParse(response.data);
  if (result.success) return result.data;

  throw new ApiError({
    code: 'INVALID_API_RESPONSE',
    message,
    status: response.status,
    requestId: response.meta.requestId ?? null,
    details: result.error.issues,
  });
}

export function createAuthService({
  client = apiClient,
  tokenStore = accessTokenStore,
} = {}) {
  async function getCurrentUser() {
    const response = await client.get('/auth/me');
    return parseResponse(
      authenticatedUserSchema,
      response,
      'El servidor devolvió una identidad no válida.',
    );
  }

  async function getPermissions() {
    const response = await client.get('/auth/permissions');
    return parseResponse(
      permissionsResponseSchema,
      response,
      'El servidor devolvió permisos no válidos.',
    ).permissions;
  }

  return Object.freeze({
    async recoverSession() {
      await client.refreshSession();
      const [user, permissions] = await Promise.all([
        getCurrentUser(),
        getPermissions(),
      ]);
      return { user, permissions };
    },

    async login(credentials) {
      const response = await client.post('/auth/login', credentials, {
        skipAuthRefresh: true,
      });
      const { accessToken, user } = parseResponse(
        loginResponseSchema,
        response,
        'El servidor devolvió una sesión no válida.',
      );

      tokenStore.set(accessToken);
      try {
        return { user, permissions: await getPermissions() };
      } catch (error) {
        tokenStore.clear();
        throw error;
      }
    },

    async logout() {
      try {
        await client.post('/auth/logout');
      } finally {
        tokenStore.clear();
      }
    },

    async logoutAll() {
      try {
        await client.post('/auth/logout-all');
      } finally {
        tokenStore.clear();
      }
    },

    async updateProfile(data) {
      const response = await client.put('/auth/profile', data);
      return parseResponse(
        authenticatedUserSchema,
        response,
        'El servidor devolvió un perfil no válido.',
      );
    },

    async changePassword(data) {
      const response = await client.post('/auth/change-password', data);
      const result = parseResponse(
        changePasswordResponseSchema,
        response,
        'El servidor devolvió una sesión no válida.',
      );
      tokenStore.set(result.accessToken);
      return result.user;
    },

    clearSession() {
      client.clearSession();
      tokenStore.clear();
    },

    setSessionExpiredHandler(handler) {
      client.setSessionExpiredHandler(handler);
    },
  });
}

export const authService = createAuthService();
