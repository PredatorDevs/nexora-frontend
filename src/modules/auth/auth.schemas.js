import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresa tu correo electrónico.')
    .email('Ingresa un correo electrónico válido.')
    .max(191, 'El correo electrónico es demasiado largo.'),
  password: z
    .string()
    .min(1, 'Ingresa tu contraseña.')
    .max(1024, 'La contraseña es demasiado larga.'),
});

export const authenticatedUserSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  displayName: z.string().min(1),
  status: z.literal('ACTIVE'),
  mustChangePassword: z.boolean().default(false),
});

export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: authenticatedUserSchema,
});

export const permissionsResponseSchema = z.object({
  permissions: z.array(z.string().regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/)),
});

export const changePasswordResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: authenticatedUserSchema,
});
