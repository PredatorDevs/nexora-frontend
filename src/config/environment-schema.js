import { z } from 'zod';

const environmentSchema = z.object({
  VITE_APP_NAME: z.string().trim().min(1).max(80),
  VITE_API_BASE_URL: z
    .string()
    .trim()
    .min(1)
    .refine(isValidApiBaseUrl, {
      message: 'Debe ser una ruta relativa absoluta o una URL HTTP(S).',
    })
    .transform(removeTrailingSlashes),
  VITE_REQUEST_TIMEOUT: z.coerce.number().int().min(1_000).max(120_000),
  VITE_ENABLE_AUDIT_MODULE: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true'),
});

function isValidApiBaseUrl(value) {
  if (/^\/(?!\/)/.test(value)) return !/[?#]/.test(value);

  try {
    const url = new URL(value);
    return (
      ['http:', 'https:'].includes(url.protocol) && !url.search && !url.hash
    );
  } catch {
    return false;
  }
}

function removeTrailingSlashes(value) {
  return value.length > 1 ? value.replace(/\/+$/, '') : value;
}

function formatEnvironmentError(error) {
  return error.issues
    .map(
      (issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`,
    )
    .join('; ');
}

export function parseEnvironment(source) {
  const result = environmentSchema.safeParse(source);

  if (!result.success) {
    throw new Error(
      `Configuración de entorno inválida: ${formatEnvironmentError(result.error)}`,
    );
  }

  return Object.freeze({
    appName: result.data.VITE_APP_NAME,
    apiBaseUrl: result.data.VITE_API_BASE_URL,
    requestTimeout: result.data.VITE_REQUEST_TIMEOUT,
    enableAuditModule: result.data.VITE_ENABLE_AUDIT_MODULE,
  });
}
