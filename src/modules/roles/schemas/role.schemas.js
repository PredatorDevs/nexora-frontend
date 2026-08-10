import { z } from 'zod';

export const permissionSchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  resource: z.string(),
  action: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export const roleSchema = z.object({
  id: z.number().int().positive(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  permissions: z.array(
    z.object({
      permission: permissionSchema.pick({
        id: true,
        code: true,
        resource: true,
        action: true,
      }),
    }),
  ),
});

export const rolesSchema = z.array(roleSchema);
export const permissionsSchema = z.array(permissionSchema);

const editableFields = {
  name: z.string().trim().min(1, 'Ingresa el nombre.').max(120),
  description: z
    .string()
    .trim()
    .max(500, 'La descripción no puede superar 500 caracteres.')
    .transform((value) => value || null),
};

export const createRoleSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z][A-Z0-9_]*$/,
      'Usa mayúsculas, números o guiones bajos y comienza con una letra.',
    )
    .max(100),
  ...editableFields,
});

export const updateRoleSchema = z.object(editableFields);
