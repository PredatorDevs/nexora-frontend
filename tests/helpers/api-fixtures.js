export const adminUser = Object.freeze({
  id: 1,
  email: 'admin@example.test',
  displayName: 'Admin User',
  status: 'ACTIVE',
  mustChangePassword: false,
});

export const managedUser = Object.freeze({
  id: 2,
  email: 'ada@example.test',
  displayName: 'Ada Lovelace',
  status: 'ACTIVE',
  securityVersion: 1,
  mustChangePassword: false,
  createdAt: '2026-07-20T12:00:00.000Z',
  updatedAt: '2026-07-20T12:00:00.000Z',
  roles: [],
});

export const customRole = Object.freeze({
  id: 4,
  code: 'OPERATIONS',
  name: 'Operaciones',
  description: 'Acceso operativo',
  isSystem: false,
  createdAt: '2026-07-20T12:00:00.000Z',
  updatedAt: '2026-07-20T12:00:00.000Z',
  permissions: [],
});

export const activeSession = Object.freeze({
  id: '0c12f11b-f429-45c4-b36a-c78bf36fdac0',
  familyId: '583c47ee-cf38-45f9-890c-728efe1cd26b',
  userId: 2,
  ipAddress: '127.0.0.1',
  userAgent: 'Test browser',
  expiresAt: '2099-08-20T12:00:00.000Z',
  lastUsedAt: null,
  revokedAt: null,
  revokedReason: null,
  createdAt: '2026-07-20T12:00:00.000Z',
  updatedAt: '2026-07-20T12:00:00.000Z',
  user: {
    id: 2,
    email: 'ada@example.test',
    displayName: 'Ada Lovelace',
  },
});

export const auditEvent = Object.freeze({
  id: '9007199254740993',
  actorUserId: 1,
  action: 'USER.CREATED',
  resourceType: 'user',
  resourceId: '2',
  result: 'SUCCESS',
  requestId: 'request-audit',
  ipAddress: '127.0.0.1',
  userAgent: 'Test browser',
  metadata: { fields: ['email', 'displayName'] },
  createdAt: '2026-07-20T12:00:00.000Z',
});

export const allPermissions = Object.freeze([
  'users.read',
  'users.create',
  'users.update',
  'users.change_status',
  'users.assign_roles',
  'users.reset_password',
  'roles.read',
  'roles.create',
  'roles.update',
  'roles.delete',
  'roles.assign_permissions',
  'permissions.read',
  'sessions.read',
  'sessions.revoke',
  'audit.read',
]);

export function pagination(total, page = 1, pageSize = 20) {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

export function success(data, options = {}) {
  return {
    status: options.status ?? 200,
    body: {
      success: true,
      data,
      meta: {
        ...(options.pagination ? { pagination: options.pagination } : {}),
        requestId: options.requestId ?? 'request-test',
      },
    },
  };
}

export function failure(code, status, details) {
  return {
    status,
    body: {
      success: false,
      error: {
        code,
        message: 'Test request failed.',
        ...(details === undefined ? {} : { details }),
      },
      meta: { requestId: 'request-error' },
    },
  };
}
