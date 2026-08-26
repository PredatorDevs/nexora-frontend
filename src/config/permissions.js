export const permissions = Object.freeze({
  companies: Object.freeze({
    read: 'companies.read',
    create: 'companies.create',
    update: 'companies.update',
    changeStatus: 'companies.change_status',
  }),
  companyMembers: Object.freeze({
    read: 'company_members.read',
    add: 'company_members.add',
    changeStatus: 'company_members.change_status',
    assignRoles: 'company_members.assign_roles',
  }),
  companyRoles: Object.freeze({
    read: 'company_roles.read',
    create: 'company_roles.create',
    update: 'company_roles.update',
    delete: 'company_roles.delete',
    assignPermissions: 'company_roles.assign_permissions',
  }),
  branches: Object.freeze({
    read: 'branches.read',
    create: 'branches.create',
    update: 'branches.update',
    changeStatus: 'branches.change_status',
  }),
  warehouseCategories: Object.freeze({
    read: 'warehouse_categories.read',
    create: 'warehouse_categories.create',
    update: 'warehouse_categories.update',
    changeStatus: 'warehouse_categories.change_status',
  }),
  warehouses: Object.freeze({
    read: 'warehouses.read',
    create: 'warehouses.create',
    update: 'warehouses.update',
    changeStatus: 'warehouses.change_status',
  }),
  locations: Object.freeze({
    read: 'locations.read',
    create: 'locations.create',
    update: 'locations.update',
    changeStatus: 'locations.change_status',
  }),
  suppliers: Object.freeze({
    read: 'suppliers.read',
    create: 'suppliers.create',
    update: 'suppliers.update',
    changeStatus: 'suppliers.change_status',
  }),
  supplierContacts: Object.freeze({
    read: 'supplier_contacts.read',
    create: 'supplier_contacts.create',
    update: 'supplier_contacts.update',
    changeStatus: 'supplier_contacts.change_status',
    setPrimary: 'supplier_contacts.set_primary',
  }),
  brands: Object.freeze({
    read: 'brands.read',
    create: 'brands.create',
    update: 'brands.update',
    changeStatus: 'brands.change_status',
  }),
  productCategories: Object.freeze({
    read: 'product_categories.read',
    create: 'product_categories.create',
    update: 'product_categories.update',
    changeStatus: 'product_categories.change_status',
  }),
  productUnits: Object.freeze({
    read: 'product_units.read',
    create: 'product_units.create',
    update: 'product_units.update',
    changeStatus: 'product_units.change_status',
  }),
  files: Object.freeze({
    read: 'files.read',
    create: 'files.create',
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
