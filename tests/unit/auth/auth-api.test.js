import { describe, expect, it, vi } from 'vitest';

import { createAccessTokenStore } from '@/api/access-token-store.js';
import { createAuthService } from '@/modules/auth/auth.api.js';

const user = {
  id: 7,
  email: 'admin@example.test',
  displayName: 'Admin User',
  status: 'ACTIVE',
  mustChangePassword: false,
};
const company = {
  id: 3,
  code: 'ACME',
  legalName: 'Acme, S.A. de C.V.',
  commercialName: 'Acme',
  status: 'ACTIVE',
};
const membership = { id: 11, companyId: company.id, company };
const permissionState = {
  scope: 'COMPANY',
  permissions: ['users.read'],
  platformPermissions: ['users.read'],
  companyPermissions: [],
};

function response(data) {
  return { data, meta: { requestId: 'request-1' }, status: 200, headers: {} };
}

describe('authService', () => {
  it('recupera token, usuario y permisos', async () => {
    const client = {
      refreshSession: vi.fn().mockResolvedValue('new-token'),
      get: vi
        .fn()
        .mockResolvedValueOnce(response(user))
        .mockResolvedValueOnce(response([]))
        .mockResolvedValueOnce(response(permissionState)),
    };
    const service = createAuthService({
      client,
      tokenStore: createAccessTokenStore(),
    });

    await expect(service.recoverSession()).resolves.toEqual({
      user,
      memberships: [],
      activeMembership: null,
      requiresCompanySelection: false,
      ...permissionState,
    });
    expect(client.refreshSession).toHaveBeenCalledOnce();
  });

  it('guarda el access token de login únicamente en el store', async () => {
    const tokenStore = createAccessTokenStore();
    const client = {
      post: vi.fn().mockResolvedValue(
        response({
          accessToken: 'token',
          user,
          activeMembership: membership,
          memberships: [membership],
          requiresCompanySelection: false,
        }),
      ),
      get: vi.fn().mockResolvedValue(response(permissionState)),
    };
    const service = createAuthService({ client, tokenStore });

    await expect(
      service.login({ email: user.email, password: 'password' }),
    ).resolves.toEqual({
      accessToken: 'token',
      user,
      activeMembership: membership,
      memberships: [membership],
      requiresCompanySelection: false,
      ...permissionState,
    });
    expect(tokenStore.get()).toBe('token');
    expect(client.post).toHaveBeenCalledWith(
      '/auth/login',
      { email: user.email, password: 'password' },
      { skipAuthRefresh: true },
    );
  });

  it('limpia el token si no puede completar el login', async () => {
    const tokenStore = createAccessTokenStore();
    const client = {
      post: vi.fn().mockResolvedValue(
        response({
          accessToken: 'token',
          user,
          activeMembership: membership,
          memberships: [membership],
          requiresCompanySelection: false,
        }),
      ),
      get: vi.fn().mockRejectedValue(new Error('permissions failed')),
    };
    const service = createAuthService({ client, tokenStore });

    await expect(
      service.login({ email: user.email, password: 'password' }),
    ).rejects.toThrow('permissions failed');
    expect(tokenStore.get()).toBeNull();
  });

  it('limpia el token aunque logout falle', async () => {
    const tokenStore = createAccessTokenStore();
    tokenStore.set('token');
    const client = { post: vi.fn().mockRejectedValue(new Error('offline')) };
    const service = createAuthService({ client, tokenStore });

    await expect(service.logout()).rejects.toThrow('offline');
    expect(tokenStore.get()).toBeNull();
  });

  it('rota el token y reconstruye el contexto al cambiar de empresa', async () => {
    const tokenStore = createAccessTokenStore();
    const contextualUser = {
      ...user,
      activeContext: { companyId: company.id, membershipId: membership.id },
    };
    const client = {
      post: vi.fn().mockResolvedValue(
        response({
          accessToken: 'switched-token',
          activeMembership: membership,
        }),
      ),
      get: vi
        .fn()
        .mockResolvedValueOnce(response(contextualUser))
        .mockResolvedValueOnce(response([membership]))
        .mockResolvedValueOnce(response(permissionState)),
    };
    const service = createAuthService({ client, tokenStore });

    await expect(service.switchCompany(company.id)).resolves.toMatchObject({
      user: contextualUser,
      memberships: [membership],
      activeMembership: membership,
      requiresCompanySelection: false,
    });
    expect(tokenStore.get()).toBe('switched-token');
    expect(client.post).toHaveBeenCalledWith('/auth/switch-company', {
      companyId: company.id,
    });
  });
});
