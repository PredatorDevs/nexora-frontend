import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { listAuditLogs } from '@/modules/audit/audit.api.js';
import {
  getEntityChange,
  listEntityChanges,
} from '@/modules/entity-changes/entity-change.api.js';
import { replaceRolePermissions } from '@/modules/roles/roles.api.js';
import { revokeSession } from '@/modules/sessions/sessions.api.js';
import { createUser, listUsers } from '@/modules/users/users.api.js';
import {
  activeSession,
  auditEvent,
  customRole,
  managedUser,
  pagination,
  success,
} from '../../helpers/api-fixtures.js';

const server = setupServer();

function json(response) {
  return HttpResponse.json(response.body, { status: response.status });
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('contratos HTTP administrativos', () => {
  it('envía filtros y normaliza el listado de usuarios', async () => {
    server.use(
      http.get('*/api/v1/users', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('search')).toBe('ada');
        expect(url.searchParams.get('page')).toBe('2');
        return json(
          success([managedUser], { pagination: pagination(21, 2, 20) }),
        );
      }),
    );

    const result = await listUsers({
      page: 2,
      pageSize: 20,
      search: 'ada',
      sortBy: 'email',
      sortOrder: 'asc',
    });
    expect(result.users).toEqual([managedUser]);
    expect(result.pagination.total).toBe(21);
  });

  it('envía exactamente el contrato de creación de usuario', async () => {
    const payload = {
      displayName: 'Ada Lovelace',
      email: 'ada@example.test',
      password: 'a-secure-password',
    };
    server.use(
      http.post('*/api/v1/users', async ({ request }) => {
        expect(await request.json()).toEqual(payload);
        return json(success(managedUser, { status: 201 }));
      }),
    );
    await expect(createUser(payload)).resolves.toEqual(managedUser);
  });

  it('reemplaza permisos usando códigos, no ids', async () => {
    server.use(
      http.put('*/api/v1/roles/4/permissions', async ({ request }) => {
        expect(await request.json()).toEqual({
          permissionCodes: ['users.read'],
        });
        return json(success(customRole));
      }),
    );
    await expect(replaceRolePermissions(4, ['users.read'])).resolves.toEqual(
      customRole,
    );
  });

  it('revoca una sesión y valida la respuesta pública', async () => {
    const revoked = {
      ...activeSession,
      revokedAt: '2026-07-21T12:00:00.000Z',
      revokedReason: 'ADMIN_REVOKED:1',
    };
    server.use(
      http.delete(`*/api/v1/sessions/${activeSession.id}`, () =>
        json(success(revoked)),
      ),
    );
    await expect(revokeSession(activeSession.id)).resolves.toEqual(revoked);
  });

  it('conserva ids bigint del historial de auditoría', async () => {
    server.use(
      http.get('*/api/v1/audit', () =>
        json(success([auditEvent], { pagination: pagination(1) })),
      ),
    );
    const result = await listAuditLogs({ page: 1, pageSize: 20 });
    expect(result.logs[0].id).toBe('9007199254740993');
  });

  it('lista resúmenes y carga snapshots sólo desde el detalle', async () => {
    const summary = {
      id: '9007199254740994',
      schemaName: 'administration',
      entityType: 'user',
      entityId: '12',
      operation: 'UPDATE',
      source: 'APPLICATION',
      actorUserId: 1,
      requestId: 'request-change-1',
      changedFields: ['displayName'],
      metadata: null,
      createdAt: '2026-07-24T12:00:00.000Z',
    };
    server.use(
      http.get('*/api/v1/entity-changes', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('entityType')).toBe('user');
        expect(url.searchParams.get('from')).toBe('2026-07-17T00:00:00.000Z');
        return json(
          success([summary], {
            pagination: pagination(1),
            range: {
              from: '2026-07-17T00:00:00.000Z',
              to: '2026-07-24T23:59:59.999Z',
            },
          }),
        );
      }),
      http.get(`*/api/v1/entity-changes/${summary.id}`, () =>
        json(
          success({
            ...summary,
            oldValues: { displayName: 'Anterior' },
            newValues: { displayName: 'Nuevo' },
          }),
        ),
      ),
    );

    const list = await listEntityChanges({
      page: 1,
      pageSize: 20,
      entityType: 'user',
      from: '2026-07-17T00:00:00.000Z',
      to: '2026-07-24T23:59:59.999Z',
    });
    expect(list.changes[0]).not.toHaveProperty('oldValues');
    await expect(getEntityChange(summary.id)).resolves.toMatchObject({
      id: summary.id,
      oldValues: { displayName: 'Anterior' },
      newValues: { displayName: 'Nuevo' },
    });
  });
});
