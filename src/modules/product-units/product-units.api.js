import { apiClient } from '@/api/api-client.js';
export async function listProductUnits(params) {
  const r = await apiClient.get('/product-units', { params });
  return { productUnits: r.data, pagination: r.meta.pagination };
}
export async function createProductUnit(data) {
  return (await apiClient.post('/product-units', data)).data;
}
export async function updateProductUnit(id, data) {
  return (await apiClient.put(`/product-units/${id}`, data)).data;
}
export async function changeProductUnitStatus(item, isActive) {
  return (
    await apiClient.patch(`/product-units/${item.id}/status`, {
      isActive,
      expectedUpdatedAt: item.updatedAt,
    })
  ).data;
}
