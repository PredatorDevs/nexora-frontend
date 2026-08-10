import { apiClient } from '@/api/api-client.js';
import { ApiError } from '@/api/api-error.js';
import {
  roleOptionsSchema,
  userSchema,
  usersSchema,
} from '@/modules/users/schemas/user.schemas.js';

function parse(schema, response) {
  const result = schema.safeParse(response.data);
  if (result.success) return result.data;
  throw new ApiError({
    code: 'INVALID_API_RESPONSE',
    message: 'El servidor devolvió usuarios no válidos.',
    status: response.status,
    requestId: response.meta.requestId,
    details: result.error.issues,
  });
}
export async function listUsers(filters) {
  const response = await apiClient.get('/users', { params: filters });
  return {
    users: parse(usersSchema, response),
    pagination: response.meta.pagination,
  };
}
export async function getUser(id) {
  const response = await apiClient.get(`/users/${id}`);
  return parse(userSchema, response);
}
export async function createUser(data) {
  const response = await apiClient.post('/users', data);
  return parse(userSchema, response);
}
export async function updateUser(id, data) {
  const response = await apiClient.put(`/users/${id}`, data);
  return parse(userSchema, response);
}
export async function changeUserStatus(id, status, expectedUpdatedAt) {
  const response = await apiClient.patch(`/users/${id}/status`, {
    status,
    expectedUpdatedAt,
  });
  return parse(userSchema, response);
}
export async function replaceUserRoles(id, roleIds, expectedUpdatedAt) {
  const response = await apiClient.put(`/users/${id}/roles`, {
    roleIds,
    expectedUpdatedAt,
  });
  return parse(userSchema, response);
}
export async function resetUserPassword(id, data) {
  const response = await apiClient.post(`/users/${id}/reset-password`, data);
  return parse(userSchema, response);
}
export async function listRoleOptions() {
  const response = await apiClient.get('/roles', {
    params: { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' },
  });
  return parse(roleOptionsSchema, response);
}
