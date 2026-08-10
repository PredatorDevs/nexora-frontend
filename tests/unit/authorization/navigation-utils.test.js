import { describe, expect, it } from 'vitest';

import { filterNavigationItems } from '@/auth/navigation-utils.js';
import { navigationItems } from '@/config/navigation.js';
import { permissions } from '@/config/permissions.js';

describe('filterNavigationItems', () => {
  it('muestra usuarios y oculta los módulos que aún no están implementados', () => {
    const result = filterNavigationItems(navigationItems, [
      permissions.users.read,
    ]);

    expect(result.map(({ key }) => key)).toEqual(['home', 'users']);
  });

  it('mantiene módulos disponibles cuando existe el permiso', () => {
    const result = filterNavigationItems(
      [
        { key: 'home', path: '/' },
        {
          key: 'users',
          path: '/users',
          permission: permissions.users.read,
        },
        {
          key: 'roles',
          path: '/roles',
          permission: permissions.roles.read,
        },
      ],
      [permissions.users.read],
    );

    expect(result.map(({ key }) => key)).toEqual(['home', 'users']);
  });

  it('elimina elementos deshabilitados aunque exista el permiso', () => {
    const result = filterNavigationItems(
      [
        {
          key: 'audit',
          path: '/audit',
          enabled: false,
          permission: permissions.audit.read,
        },
      ],
      [permissions.audit.read],
    );

    expect(result).toEqual([]);
  });

  it('filtra recursivamente grupos sin elementos visibles', () => {
    const result = filterNavigationItems(
      [
        {
          key: 'administration',
          children: [
            {
              key: 'roles',
              path: '/roles',
              permission: permissions.roles.read,
            },
          ],
        },
      ],
      [],
    );

    expect(result).toEqual([]);
  });
});
