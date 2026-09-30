import { apiClient } from '@/api/api-client.js';

export async function listRetaceos(params) {
  const response = await apiClient.get('/retaceos', { params });
  return { retaceos: response.data, pagination: response.meta.pagination };
}
export async function getRetaceo(id) {
  return (await apiClient.get(`/retaceos/${id}`)).data;
}
export async function listEligiblePurchases(params) {
  const response = await apiClient.get('/retaceos/eligible-purchases', { params });
  return { purchases: response.data, pagination: response.meta.pagination };
}
export async function createRetaceo(data) {
  return (await apiClient.post('/retaceos', data)).data;
}
export async function updateRetaceo(item, data) {
  return (await apiClient.put(`/retaceos/${item.id}`, {
    ...data,
    expectedUpdatedAt: item.updatedAt,
  })).data;
}
export async function createRetaceoCost(item, data) {
  return (await apiClient.post(`/retaceos/${item.id}/costs`, {
    ...data,
    expectedRetaceoUpdatedAt: item.updatedAt,
  })).data;
}
export async function updateRetaceoCost(item, cost, data) {
  return (await apiClient.put(`/retaceos/${item.id}/costs/${cost.id}`, {
    ...data,
    expectedRetaceoUpdatedAt: item.updatedAt,
  })).data;
}
export async function deleteRetaceoCost(item, cost) {
  return (await apiClient.delete(`/retaceos/${item.id}/costs/${cost.id}`, {
    data: { expectedRetaceoUpdatedAt: item.updatedAt },
  })).data;
}
export async function calculateRetaceo(item, manualAllocations = []) {
  return (await apiClient.post(`/retaceos/${item.id}/calculate`, {
    expectedUpdatedAt: item.updatedAt,
    manualAllocations,
  })).data;
}
export async function transitionRetaceo(item, action, reason) {
  return (await apiClient.post(`/retaceos/${item.id}/${action}`, {
    expectedUpdatedAt: item.updatedAt,
    ...(reason ? { reason } : {}),
  })).data;
}
