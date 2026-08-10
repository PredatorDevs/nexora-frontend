import { apiClient } from '@/api/api-client.js';
import { ApiError } from '@/api/api-error.js';
import {
  roleSchema,
  rolesSchema,
} from '@/modules/roles/schemas/role.schemas.js';

function parse(schema, response) {
  const result = schema.safeParse(response.data);
  if (result.success) return result.data;
  throw new ApiError({
    code: 'INVALID_API_RESPONSE',
    message: 'El servidor devolvió roles no válidos.',
    status: response.status,
    requestId: response.meta.requestId,
    details: result.error.issues,
  });
}

export async function listRoles(filters) {
  const response = await apiClient.get('/roles', { params: filters });
  return {
    roles: parse(rolesSchema, response),
    pagination: response.meta.pagination,
  };
}

export async function getRole(id) {
  const response = await apiClient.get(`/roles/${id}`);
  return parse(roleSchema, response);
}

export async function createRole(data) {
  const response = await apiClient.post('/roles', data);
  return parse(roleSchema, response);
}

export async function updateRole(id, data) {
  const response = await apiClient.put(`/roles/${id}`, data);
  return parse(roleSchema, response);
}

export async function deleteRole(id, expectedUpdatedAt) {
  await apiClient.delete(`/roles/${id}`, { params: { expectedUpdatedAt } });
}

export async function replaceRolePermissions(
  id,
  permissionCodes,
  expectedUpdatedAt,
) {
  const response = await apiClient.put(`/roles/${id}/permissions`, {
    permissionCodes,
    expectedUpdatedAt,
  });
  return parse(roleSchema, response);
}
