export const queryKeys = Object.freeze({
  auth: Object.freeze({
    me: Object.freeze(['auth', 'me']),
    permissions: Object.freeze(['auth', 'permissions']),
  }),
  companies: Object.freeze({
    all: Object.freeze(['companies']),
    list: (filters) => ['companies', 'list', filters],
    detail: (id) => ['companies', 'detail', Number(id)],
  }),
  companyAccess: Object.freeze({
    all: Object.freeze(['company-access']),
    members: (id) => ['company-access', Number(id), 'members'],
    roles: (id) => ['company-access', Number(id), 'roles'],
  }),
  branches: Object.freeze({
    all: Object.freeze(['branches']),
    list: (filters) => ['branches', 'list', filters],
    detail: (id) => ['branches', 'detail', Number(id)],
  }),
  warehouseCategories: Object.freeze({
    all: Object.freeze(['warehouse-categories']),
    list: (filters) => ['warehouse-categories', 'list', filters],
  }),
  warehouses: Object.freeze({
    all: Object.freeze(['warehouses']),
    list: (filters) => ['warehouses', 'list', filters],
  }),
  locations: Object.freeze({
    all: Object.freeze(['locations']),
    list: (filters) => ['locations', 'list', filters],
  }),
  suppliers: Object.freeze({
    all: Object.freeze(['suppliers']),
    list: (filters) => ['suppliers', 'list', filters],
    contactsAll: (supplierId) => ['suppliers', Number(supplierId), 'contacts'],
    contacts: (supplierId, filters) => ['suppliers', Number(supplierId), 'contacts', filters],
  }),
  users: Object.freeze({
    all: Object.freeze(['users']),
    list: (filters) => ['users', 'list', filters],
    detail: (id) => ['users', 'detail', Number(id)],
  }),
  roles: Object.freeze({
    all: Object.freeze(['roles']),
    list: (filters) => ['roles', 'list', filters],
    detail: (id) => ['roles', 'detail', Number(id)],
    options: Object.freeze(['roles', 'options']),
  }),
  permissions: Object.freeze({
    all: Object.freeze(['permissions']),
    list: (filters) => ['permissions', 'list', filters],
    catalog: Object.freeze(['permissions', 'catalog']),
  }),
  sessions: Object.freeze({
    all: Object.freeze(['sessions']),
    list: (filters) => ['sessions', 'list', filters],
  }),
  audit: Object.freeze({
    all: Object.freeze(['audit']),
    list: (filters) => ['audit', 'list', filters],
  }),
  entityChanges: Object.freeze({
    all: Object.freeze(['entity-changes']),
    list: (filters) => ['entity-changes', 'list', filters],
    detail: (id) => ['entity-changes', 'detail', String(id)],
  }),
});
