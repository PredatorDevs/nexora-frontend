import { routes } from '@/app/routes.js';
import { environment } from '@/config/environment.js';
import { permissions } from '@/config/permissions.js';

export const navigationItems = Object.freeze([
  Object.freeze({
    key: 'companies',
    label: 'Empresas',
    path: routes.companies,
    icon: 'home',
    permission: permissions.companies.read,
  }),
  Object.freeze({
    key: 'company-access',
    label: 'Acceso de empresa',
    path: routes.companyAccess,
    icon: 'roles',
    permission: permissions.companyMembers.read,
  }),
  Object.freeze({
    key: 'branches',
    label: 'Sucursales',
    path: routes.branches,
    icon: 'home',
    permission: permissions.branches.read,
  }),
  Object.freeze({
    key: 'home',
    label: 'Inicio',
    path: routes.home,
    icon: 'home',
  }),
  Object.freeze({
    key: 'users',
    label: 'Usuarios',
    path: routes.users,
    icon: 'users',
    permission: permissions.users.read,
  }),
  Object.freeze({
    key: 'roles',
    label: 'Roles',
    path: routes.roles,
    icon: 'roles',
    permission: permissions.roles.read,
  }),
  Object.freeze({
    key: 'permissions',
    label: 'Permisos',
    path: routes.permissions,
    icon: 'permissions',
    permission: permissions.permissions.read,
  }),
  Object.freeze({
    key: 'sessions',
    label: 'Sesiones',
    path: routes.sessions,
    icon: 'sessions',
    permission: permissions.sessions.read,
  }),
  Object.freeze({
    key: 'audit',
    label: 'Auditoría',
    path: routes.audit,
    icon: 'audit',
    permission: permissions.audit.read,
    enabled: environment.enableAuditModule,
  }),
  Object.freeze({
    key: 'entity-changes',
    label: 'Historial de cambios',
    path: routes.entityChanges,
    icon: 'audit',
    permission: permissions.audit.read,
    enabled: environment.enableAuditModule,
  }),
]);
