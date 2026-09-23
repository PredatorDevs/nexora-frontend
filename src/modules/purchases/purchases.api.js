import { apiClient } from '@/api/api-client.js';
import { listPurchaseOrders } from '@/modules/purchase-orders/purchase-orders.api.js';
export async function listPurchases(params) {
  const response = await apiClient.get('/purchases', { params });
  return { purchases: response.data, pagination: response.meta.pagination };
}
export async function getPurchase(id) {
  return (await apiClient.get(`/purchases/${id}`)).data;
}
export async function listReceivableOrders() {
  const params = {
    page: 1,
    pageSize: 100,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };
  const [sent, partial] = await Promise.all([
    listPurchaseOrders({ ...params, status: 'SENT' }),
    listPurchaseOrders({ ...params, status: 'PARTIALLY_RECEIVED' }),
  ]);
  return [...sent.purchaseOrders, ...partial.purchaseOrders];
}
export async function getPurchaseAvailability(orderId, purchaseId) {
  return (
    await apiClient.get(`/purchases/orders/${orderId}/availability`, {
      params: purchaseId ? { purchaseId } : undefined,
    })
  ).data;
}
export async function createPurchase(data) {
  return (await apiClient.post('/purchases', data)).data;
}
export async function updatePurchase(item, data) {
  return (
    await apiClient.put(`/purchases/${item.id}`, {
      ...data,
      expectedUpdatedAt: item.updatedAt,
    })
  ).data;
}
export async function transitionPurchase(item, action, reason) {
  return (
    await apiClient.post(`/purchases/${item.id}/${action}`, {
      expectedUpdatedAt: item.updatedAt,
      ...(['receive', 'cancel'].includes(action)
        ? { expectedOrderUpdatedAt: item.purchaseOrder.updatedAt }
        : {}),
      ...(reason ? { reason } : {}),
    })
  ).data;
}
