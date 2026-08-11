export const permissions = Object.freeze({
  companies: Object.freeze({
    read: 'companies.read', create: 'companies.create', update: 'companies.update', changeStatus: 'companies.change_status',
  }),
  companyMembers: Object.freeze({
    read: 'company_members.read', add: 'company_members.add', changeStatus: 'company_members.change_status', assignRoles: 'company_members.assign_roles',
  }),
  companyRoles: Object.freeze({
    read: 'company_roles.read', create: 'company_roles.create', update: 'company_roles.update', delete: 'company_roles.delete', assignPermissions: 'company_roles.assign_permissions',
  }),
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
