import { apiClient } from '@/api/api-client.js';

export async function listPurchaseRequests(params) {
  const response = await apiClient.get('/purchase-requests', { params });
  return {
    purchaseRequests: response.data,
    pagination: response.meta.pagination,
  };
}
export async function getPurchaseRequest(id) {
  return (await apiClient.get(`/purchase-requests/${id}`)).data;
}
export async function downloadPurchaseRequestPdf(id, code) {
  const response = await apiClient.get(`/purchase-requests/${id}/pdf`, {
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `solicitud-${code}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
export async function createPurchaseRequest(data) {
  return (await apiClient.post('/purchase-requests', data)).data;
}
export async function consolidatePurchaseRequests(data) {
  return (await apiClient.post('/purchase-requests/consolidate', data)).data;
}
export async function updatePurchaseRequest(id, data) {
  return (await apiClient.put(`/purchase-requests/${id}`, data)).data;
}
export async function transitionPurchaseRequest(
  id,
  action,
  expectedUpdatedAt,
  reason,
) {
  return (
    await apiClient.post(`/purchase-requests/${id}/${action}`, {
      expectedUpdatedAt,
      ...(reason ? { reason } : {}),
    })
  ).data;
}
