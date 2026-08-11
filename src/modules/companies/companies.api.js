import { apiClient } from '@/api/api-client.js';

export async function listCompanies(params) {
  const response = await apiClient.get('/companies', { params });
  return { companies: response.data, pagination: response.meta.pagination };
}
export async function createCompany(data) {
  return (await apiClient.post('/companies', data)).data;
}
export async function changeCompanyStatus(id, status, expectedUpdatedAt) {
  return (await apiClient.patch(`/companies/${id}/status`, { status, expectedUpdatedAt })).data;
}
