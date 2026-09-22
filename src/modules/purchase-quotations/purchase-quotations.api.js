import { apiClient } from '@/api/api-client.js';
export async function listPurchaseQuotations(params) {
  const response = await apiClient.get('/purchase-quotations', { params });
  return {
    purchaseQuotations: response.data,
    pagination: response.meta.pagination,
  };
}
export async function getPurchaseQuotation(id) {
  return (await apiClient.get(`/purchase-quotations/${id}`)).data;
}
export async function createPurchaseQuotation(data) {
  return (await apiClient.post('/purchase-quotations', data)).data;
}
export async function updatePurchaseQuotation(id, data) {
  return (await apiClient.put(`/purchase-quotations/${id}`, data)).data;
}
export async function replacePurchaseQuotationRequestLinks(item, links) {
  return (
    await apiClient.put(`/purchase-quotations/${item.id}/request-links`, {
      expectedUpdatedAt: item.updatedAt,
      links,
    })
  ).data;
}
export async function replacePurchaseQuotationExpenses(item, expenses) {
  return (
    await apiClient.put(`/purchase-quotations/${item.id}/expenses`, {
      expectedUpdatedAt: item.updatedAt,
      expenses,
    })
  ).data;
}
export async function transitionPurchaseQuotation(item, action, reason) {
  return (
    await apiClient.post(`/purchase-quotations/${item.id}/${action}`, {
      expectedUpdatedAt: item.updatedAt,
      ...(reason ? { reason } : {}),
    })
  ).data;
}
