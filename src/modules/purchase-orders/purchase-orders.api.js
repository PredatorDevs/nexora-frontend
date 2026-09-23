import { apiClient } from '@/api/api-client.js';
export async function listPurchaseOrders(params) {
  const response = await apiClient.get('/purchase-orders', { params });
  return {
    purchaseOrders: response.data,
    pagination: response.meta.pagination,
  };
}
export async function getPurchaseOrder(id) {
  return (await apiClient.get(`/purchase-orders/${id}`)).data;
}
export async function generatePurchaseOrders(data) {
  return (await apiClient.post('/purchase-orders/generate', data)).data;
}
export async function transitionPurchaseOrder(item, action, reason) {
  return (
    await apiClient.post(`/purchase-orders/${item.id}/${action}`, {
      expectedUpdatedAt: item.updatedAt,
      ...(reason ? { reason } : {}),
    })
  ).data;
}
export async function createPurchaseOrderExpense(order, data) {
  return (
    await apiClient.post(`/purchase-orders/${order.id}/expenses`, {
      ...data,
      expectedOrderUpdatedAt: order.updatedAt,
    })
  ).data;
}
export async function updatePurchaseOrderExpense(order, expense, data) {
  return (
    await apiClient.put(`/purchase-orders/${order.id}/expenses/${expense.id}`, {
      ...data,
      expectedOrderUpdatedAt: order.updatedAt,
      expectedUpdatedAt: expense.updatedAt,
    })
  ).data;
}
export async function deletePurchaseOrderExpense(order, expense) {
  return (
    await apiClient.delete(
      `/purchase-orders/${order.id}/expenses/${expense.id}`,
      {
        data: {
          expectedOrderUpdatedAt: order.updatedAt,
          expectedUpdatedAt: expense.updatedAt,
        },
      },
    )
  ).data;
}
export async function uploadPurchaseOrderDocument(orderId, expenseId, file) {
  const prepared = (
    await apiClient.post(
      `/purchase-orders/${orderId}/expenses/${expenseId}/documents/upload`,
      { fileName: file.name, contentType: file.type, sizeBytes: file.size },
    )
  ).data;
  const form = new FormData();
  Object.entries(prepared.fields).forEach(([key, value]) =>
    form.append(key, value),
  );
  form.append('file', file);
  const response = await fetch(prepared.uploadUrl, {
    method: prepared.method,
    body: form,
  });
  if (!response.ok)
    throw new Error('S3 no pudo completar la carga del documento.');
  return (
    await apiClient.post(
      `/purchase-orders/${orderId}/expenses/${expenseId}/documents`,
      { storageKey: prepared.storageKey, originalFileName: file.name },
    )
  ).data;
}
export async function openPurchaseOrderDocument(
  orderId,
  expenseId,
  documentId,
) {
  const document = (
    await apiClient.get(
      `/purchase-orders/${orderId}/expenses/${expenseId}/documents/${documentId}`,
    )
  ).data;
  window.open(document.url, '_blank', 'noopener,noreferrer');
}
export async function deletePurchaseOrderDocument(
  orderId,
  expenseId,
  documentId,
) {
  return (
    await apiClient.delete(
      `/purchase-orders/${orderId}/expenses/${expenseId}/documents/${documentId}`,
    )
  ).data;
}
