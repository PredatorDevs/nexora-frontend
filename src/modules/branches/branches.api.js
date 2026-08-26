import { apiClient } from '@/api/api-client.js';
export async function listBranches(params) {
  const response = await apiClient.get('/branches', { params });
  return { branches: response.data, pagination: response.meta.pagination };
}
export async function getBranch(id) {
  return (await apiClient.get(`/branches/${id}`)).data;
}
export async function createBranch(data) {
  return (await apiClient.post('/branches', data)).data;
}
export async function updateBranch(id, data) {
  return (await apiClient.put(`/branches/${id}`, data)).data;
}
export async function changeBranchStatus(id, status, expectedUpdatedAt) {
  return (
    await apiClient.patch(`/branches/${id}/status`, {
      status,
      expectedUpdatedAt,
    })
  ).data;
}
