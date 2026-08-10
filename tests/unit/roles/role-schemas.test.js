import { describe, expect, it } from 'vitest';
import {
  createRoleSchema,
  permissionSchema,
  roleSchema,
} from '@/modules/roles/schemas/role.schemas.js';

describe('role schemas', () => {
  it('normaliza el código y la descripción al crear un rol', () => {
    const result = createRoleSchema.parse({
      code: ' operations_manager ',
      name: 'Operaciones',
      description: '',
    });
    expect(result).toEqual({
      code: 'OPERATIONS_MANAGER',
      name: 'Operaciones',
      description: null,
    });
  });

  it('rechaza códigos que no cumplen la convención del backend', () => {
    expect(
      createRoleSchema.safeParse({
        code: '9-invalid-code',
        name: 'Inválido',
        description: '',
      }).success,
    ).toBe(false);
  });

  it('valida roles con sus asignaciones de permisos', () => {
    const result = roleSchema.safeParse({
      id: 2,
      code: 'AUDITOR',
      name: 'Auditor',
      description: null,
      isSystem: true,
      createdAt: '2026-07-20T12:00:00.000Z',
      updatedAt: '2026-07-20T12:00:00.000Z',
      permissions: [
        {
          permission: {
            id: 12,
            code: 'audit.read',
            resource: 'audit',
            action: 'read',
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('acepta la descripción opcional del catálogo de permisos', () => {
    expect(
      permissionSchema.safeParse({
        id: 1,
        code: 'users.read',
        resource: 'users',
        action: 'read',
        description: null,
        createdAt: '2026-07-20T12:00:00.000Z',
      }).success,
    ).toBe(true);
  });
});
