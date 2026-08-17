import { accessTokenStore } from '@/api/access-token-store.js';
import { apiClient } from '@/api/api-client.js';
import { ApiError } from '@/api/api-error.js';
import {
  authenticatedUserSchema,
  loginResponseSchema,
  permissionsResponseSchema,
  changePasswordResponseSchema,
  membershipsSchema,
  switchCompanyResponseSchema,
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
    );
  }

  async function getMemberships() {
    const response = await client.get('/auth/companies');
    return parseResponse(membershipsSchema, response, 'El servidor devolvió empresas no vÃ¡lidas.');
  }

  async function hydrate(user, memberships) {
    const permissionState = await getPermissions();
    const activeMembership = memberships.find(
      (item) => item.id === user.activeContext?.membershipId,
    ) ?? null;
    return {
      user,
      memberships,
      activeMembership,
      requiresCompanySelection:
        memberships.length > 0 &&
        !activeMembership &&
        permissionState.platformPermissions.length === 0,
      ...permissionState,
    };
  }

  return Object.freeze({
    async refreshCompanyContext() {
      const [user, memberships] = await Promise.all([getCurrentUser(), getMemberships()]);
      return hydrate(user, memberships);
    },
    async recoverSession() {
      await client.refreshSession();
      const [user, memberships] = await Promise.all([
        getCurrentUser(),
        getMemberships(),
      ]);
      return hydrate(user, memberships);
    },

    async login(credentials) {
      const response = await client.post('/auth/login', credentials, {
        skipAuthRefresh: true,
      });
      const result = parseResponse(
        loginResponseSchema,
        response,
        'El servidor devolvió una sesión no válida.',
      );

      tokenStore.set(result.accessToken);
      try {
        const permissionState = await getPermissions();
        return {
          ...result,
          requiresCompanySelection:
            result.requiresCompanySelection &&
            permissionState.platformPermissions.length === 0,
          ...permissionState,
        };
      } catch (error) {
        tokenStore.clear();
        throw error;
      }
    },

    async switchCompany(companyId) {
      const response = await client.post('/auth/switch-company', { companyId });
      const result = parseResponse(switchCompanyResponseSchema, response, 'No fue posible cambiar de empresa.');
      tokenStore.set(result.accessToken);
      const [user, memberships, permissionState] = await Promise.all([
        getCurrentUser(), getMemberships(), getPermissions(),
      ]);
      return { user, memberships, activeMembership: result.activeMembership, requiresCompanySelection: false, ...permissionState };
    },

    async switchPlatform() {
      const response = await client.post('/auth/switch-platform');
      const result = parseResponse(
        switchCompanyResponseSchema,
        response,
        'No fue posible volver a la administración de plataforma.',
      );
      tokenStore.set(result.accessToken);
      const [user, memberships, permissionState] = await Promise.all([
        getCurrentUser(),
        getMemberships(),
        getPermissions(),
      ]);
      return {
        user,
        memberships,
        activeMembership: null,
        requiresCompanySelection: false,
        ...permissionState,
      };
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
