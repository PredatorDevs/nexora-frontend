import { describe, expect, it } from 'vitest';

import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isPermissionCode,
  matchesPermissionRequirement,
} from '@/auth/permission-utils.js';
import { permissionCodes, permissions } from '@/config/permissions.js';

const backendPermissionCatalog = [
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
  'audit.read',
  'sessions.read',
  'sessions.revoke',
];

describe('catálogo de permisos', () => {
  it('permanece sincronizado con el catálogo implementado por el backend', () => {
    expect(permissionCodes).toEqual(backendPermissionCatalog);
    expect(new Set(permissionCodes).size).toBe(permissionCodes.length);
  });
});

describe('permission-utils', () => {
  const effective = [permissions.users.read, permissions.users.update];

  it.each([
    ['users.read', true],
    ['roles.read', true],
    ['USERS.READ', false],
    ['ADMIN', false],
    ['', false],
  ])('valida el código %j', (permission, expected) => {
    expect(isPermissionCode(permission)).toBe(expected);
  });

  it('evalúa un permiso concreto', () => {
    expect(hasPermission(effective, permissions.users.read)).toBe(true);
    expect(hasPermission(effective, permissions.roles.read)).toBe(false);
    expect(hasPermission(effective, 'ADMIN')).toBe(false);
  });

  it('evalúa condiciones anyOf y allOf', () => {
    expect(
      hasAnyPermission(effective, [
        permissions.roles.read,
        permissions.users.read,
      ]),
    ).toBe(true);
    expect(
      hasAllPermissions(effective, [
        permissions.users.read,
        permissions.users.update,
      ]),
    ).toBe(true);
    expect(
      hasAllPermissions(effective, [
        permissions.users.read,
        permissions.roles.read,
      ]),
    ).toBe(false);
  });

  it('deniega listas vacías, valores inválidos y requisitos ausentes', () => {
    expect(hasAnyPermission(effective, [])).toBe(false);
    expect(hasAllPermissions(effective, [])).toBe(false);
    expect(hasPermission(effective, undefined)).toBe(false);
    expect(matchesPermissionRequirement(effective)).toBe(false);
  });

  it('exige todas las condiciones declaradas cuando se combinan', () => {
    expect(
      matchesPermissionRequirement(effective, {
        permission: permissions.users.read,
        anyOf: [permissions.users.update, permissions.roles.update],
        allOf: [permissions.users.read, permissions.users.update],
      }),
    ).toBe(true);

    expect(
      matchesPermissionRequirement(effective, {
        permission: permissions.users.read,
        anyOf: [permissions.roles.read],
      }),
    ).toBe(false);
  });
});
