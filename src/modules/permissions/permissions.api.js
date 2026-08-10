import { apiClient } from '@/api/api-client.js';
import { ApiError } from '@/api/api-error.js';
import { permissionsSchema } from '@/modules/roles/schemas/role.schemas.js';

function parse(response) {
  const result = permissionsSchema.safeParse(response.data);
  if (result.success) return result.data;
  throw new ApiError({
    code: 'INVALID_API_RESPONSE',
    message: 'El servidor devolvió permisos no válidos.',
    status: response.status,
    requestId: response.meta.requestId,
    details: result.error.issues,
  });
}

export async function listPermissions(filters) {
  const response = await apiClient.get('/permissions', { params: filters });
  return {
    permissions: parse(response),
    pagination: response.meta.pagination,
  };
}

export async function getPermissionCatalog() {
  const response = await apiClient.get('/permissions', {
    params: { page: 1, pageSize: 100, sortBy: 'code', sortOrder: 'asc' },
  });
  return parse(response);
}
