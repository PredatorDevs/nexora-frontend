import { apiClient } from '@/api/api-client.js';

export async function listAdjustments(params) {
  const response = await apiClient.get('/inventory-adjustments', { params });
  return { adjustments: response.data, pagination: response.meta.pagination };
}
export async function getAdjustment(id) {
  return (await apiClient.get(`/inventory-adjustments/${id}`)).data;
}
export async function createAdjustment(data) {
  return (await apiClient.post('/inventory-adjustments', data)).data;
}
export async function transitionAdjustment(item, action, reason) {
  return (await apiClient.post(`/inventory-adjustments/${item.id}/${action}`, {
    expectedUpdatedAt: item.updatedAt, ...(reason ? { reason } : {}),
  })).data;
}
export async function reverseMovement(id, reason) {
  return (await apiClient.post(`/inventory-adjustments/movements/${id}/reverse`, { reason })).data;
}

