import { apiClient } from '@/api/api-client.js';
export async function listTransfers(params) {
  const response = await apiClient.get('/inventory-transfers', { params });
  return { transfers: response.data, pagination: response.meta.pagination };
}
export async function getTransfer(id) {
  return (await apiClient.get(`/inventory-transfers/${id}`)).data;
}
export async function createTransfer(data) {
  return (await apiClient.post('/inventory-transfers', data)).data;
}
export async function transitionTransfer(item, action, reason) {
  return (await apiClient.post(`/inventory-transfers/${item.id}/${action}`, {
    expectedUpdatedAt: item.updatedAt, ...(reason ? { reason } : {}),
  })).data;
}
export async function createRelocation(data) {
  return (await apiClient.post('/inventory-transfers/relocations', data)).data;
}
