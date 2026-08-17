import { apiClient } from '@/api/api-client.js';

export async function listWarehouseCategories(params) {
  const response = await apiClient.get('/warehouse-categories', { params });
  return { warehouseCategories: response.data, pagination: response.meta.pagination };
}
export async function createWarehouseCategory(data) {
  return (await apiClient.post('/warehouse-categories', data)).data;
}
export async function updateWarehouseCategory(id, data) {
  return (await apiClient.put(`/warehouse-categories/${id}`, data)).data;
}
export async function changeWarehouseCategoryStatus(id, isActive, expectedUpdatedAt) {
  return (await apiClient.patch(`/warehouse-categories/${id}/status`, { isActive, expectedUpdatedAt })).data;
}
