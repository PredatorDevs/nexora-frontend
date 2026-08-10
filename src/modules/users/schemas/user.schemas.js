import { z } from 'zod';

const roleSchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  name: z.string(),
});
export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  displayName: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  securityVersion: z.number().int(),
  mustChangePassword: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  roles: z.array(z.object({ role: roleSchema, assignedAt: z.string() })),
});
export const usersSchema = z.array(userSchema);
export const roleOptionsSchema = z.array(
  z
    .object({
      id: z.number().int().positive(),
      code: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      isSystem: z.boolean(),
    })
    .passthrough(),
);

const identityFields = {
  displayName: z.string().trim().min(1, 'Ingresa el nombre.').max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Ingresa un correo válido.')
    .max(191),
};
export const createUserSchema = z
  .object({
    ...identityFields,
    password: z
      .string()
      .min(12, 'La contraseña debe tener al menos 12 caracteres.')
      .max(1024),
    confirmPassword: z.string(),
    mustChangePassword: z.boolean().default(true),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  });
export const updateUserSchema = z.object(identityFields);
