import { describe, expect, it } from 'vitest';

import {
  createUserSchema,
  userSchema,
} from '@/modules/users/schemas/user.schemas.js';

describe('user schemas', () => {
  it('valida la representación pública entregada por el backend', () => {
    const result = userSchema.safeParse({
      id: 7,
      email: 'admin@example.com',
      displayName: 'Admin',
      status: 'ACTIVE',
      securityVersion: 2,
      createdAt: '2026-07-20T12:00:00.000Z',
      updatedAt: '2026-07-20T12:00:00.000Z',
      roles: [
        {
          role: { id: 1, code: 'admin', name: 'Administrador' },
          assignedAt: '2026-07-20T12:00:00.000Z',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('exige contraseña de 12 caracteres y confirmación coincidente', () => {
    const shortPassword = createUserSchema.safeParse({
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'short',
      confirmPassword: 'short',
    });
    const mismatch = createUserSchema.safeParse({
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'a-secure-password',
      confirmPassword: 'another-password',
    });

    expect(shortPassword.success).toBe(false);
    expect(mismatch.success).toBe(false);
    expect(
      mismatch.error.issues.some(
        ({ path }) => path.join('.') === 'confirmPassword',
      ),
    ).toBe(true);
  });
});
