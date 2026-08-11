import { apiClient } from '@/api/api-client.js';

export async function listMembers(companyId) {
  const response = await apiClient.get(`/companies/${companyId}/members`, {
    params: { page: 1, pageSize: 100, sortBy: 'createdAt', sortOrder: 'asc' },
  });
  return response.data;
}
export async function listRoles(companyId) {
  const response = await apiClient.get(`/companies/${companyId}/roles`, {
    params: { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' },
  });
  return response.data;
}
export async function addMember(companyId, data) {
  return (await apiClient.post(`/companies/${companyId}/members`, data)).data;
}
export async function createRole(companyId, data) {
  return (await apiClient.post(`/companies/${companyId}/roles`, data)).data;
}
export async function changeMemberStatus(
  companyId,
  membershipId,
  status,
  expectedUpdatedAt,
) {
  return (
    await apiClient.patch(
      `/companies/${companyId}/members/${membershipId}/status`,
      { status, expectedUpdatedAt },
    )
  ).data;
}
export async function replaceMemberRoles(
  companyId,
  membershipId,
  roleIds,
  expectedUpdatedAt,
) {
  return (
    await apiClient.put(
      `/companies/${companyId}/members/${membershipId}/roles`,
      { roleIds, expectedUpdatedAt },
    )
  ).data;
}
export async function updateRole(companyId, roleId, data) {
  return (await apiClient.put(`/companies/${companyId}/roles/${roleId}`, data))
    .data;
}
export async function deleteRole(companyId, roleId, expectedUpdatedAt) {
  await apiClient.delete(`/companies/${companyId}/roles/${roleId}`, {
    params: { expectedUpdatedAt },
  });
}
export async function replaceRolePermissions(
  companyId,
  roleId,
  permissionCodes,
  expectedUpdatedAt,
) {
  return (
    await apiClient.put(`/companies/${companyId}/roles/${roleId}/permissions`, {
      permissionCodes,
      expectedUpdatedAt,
    })
  ).data;
}
