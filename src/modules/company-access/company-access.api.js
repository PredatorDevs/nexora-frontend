import { apiClient } from '@/api/api-client.js';

export async function listMembers(companyId) {
  const response = await apiClient.get(`/companies/${companyId}/members`, { params: { page: 1, pageSize: 100, sortBy: 'createdAt', sortOrder: 'asc' } });
  return response.data;
}
export async function listRoles(companyId) {
  const response = await apiClient.get(`/companies/${companyId}/roles`, { params: { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' } });
  return response.data;
}
export async function addMember(companyId, data) { return (await apiClient.post(`/companies/${companyId}/members`, data)).data; }
export async function createRole(companyId, data) { return (await apiClient.post(`/companies/${companyId}/roles`, data)).data; }
