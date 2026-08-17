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
  activeContext: z
    .object({ companyId: z.number().int().positive(), membershipId: z.number().int().positive() })
    .nullable()
    .optional(),
});

export const membershipSchema = z.object({
  id: z.number().int().positive(),
  companyId: z.number().int().positive(),
  company: z.object({
    id: z.number().int().positive(),
    code: z.string(),
    legalName: z.string(),
    commercialName: z.string().nullable().optional(),
    status: z.string(),
  }),
});

export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: authenticatedUserSchema,
  activeMembership: membershipSchema.nullable(),
  memberships: z.array(membershipSchema),
  requiresCompanySelection: z.boolean(),
});

export const membershipsSchema = z.array(membershipSchema);
export const switchCompanyResponseSchema = z.object({
  accessToken: z.string().min(1),
  activeMembership: membershipSchema.nullable(),
});

export const permissionsResponseSchema = z.object({
  permissions: z.array(z.string().regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/)),
  scope: z.enum(['PLATFORM', 'COMPANY']).optional(),
  platformPermissions: z.array(z.string()).default([]),
  companyPermissions: z.array(z.string()).default([]),
});

export const changePasswordResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: authenticatedUserSchema,
});
