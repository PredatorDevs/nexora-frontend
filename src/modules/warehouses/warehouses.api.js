import { apiClient } from '@/api/api-client.js';

export async function listWarehouses(params) {
  const response = await apiClient.get('/warehouses', { params });
  return { warehouses: response.data, pagination: response.meta.pagination };
}
export async function createWarehouse(data) {
  return (await apiClient.post('/warehouses', data)).data;
}
export async function updateWarehouse(id, data) {
  return (await apiClient.put(`/warehouses/${id}`, data)).data;
}
export async function changeWarehouseStatus(id, isActive, expectedUpdatedAt) {
  return (await apiClient.patch(`/warehouses/${id}/status`, { isActive, expectedUpdatedAt })).data;
}
