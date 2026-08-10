export const permissions = Object.freeze({
  users: Object.freeze({
    read: 'users.read',
    create: 'users.create',
    update: 'users.update',
    changeStatus: 'users.change_status',
    assignRoles: 'users.assign_roles',
    resetPassword: 'users.reset_password',
  }),
  roles: Object.freeze({
    read: 'roles.read',
    create: 'roles.create',
    update: 'roles.update',
    delete: 'roles.delete',
    assignPermissions: 'roles.assign_permissions',
  }),
  permissions: Object.freeze({
    read: 'permissions.read',
  }),
  audit: Object.freeze({
    read: 'audit.read',
  }),
  sessions: Object.freeze({
    read: 'sessions.read',
    revoke: 'sessions.revoke',
  }),
});

export const permissionCodes = Object.freeze([
  ...Object.values(permissions.users),
  ...Object.values(permissions.roles),
  ...Object.values(permissions.permissions),
  ...Object.values(permissions.audit),
  ...Object.values(permissions.sessions),
]);
