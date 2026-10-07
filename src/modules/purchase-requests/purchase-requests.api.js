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
export async function listPurchaseRequestSegments(requestId) {
  return (await apiClient.get(`/purchase-requests/${requestId}/segments`)).data;
}
export async function createPurchaseRequestSegment(requestId, data) {
  return (await apiClient.post(`/purchase-requests/${requestId}/segments`, data)).data;
}
export async function updatePurchaseRequestSegment(requestId, segment, data) {
  return (await apiClient.put(`/purchase-requests/${requestId}/segments/${segment.id}`, {
    ...data,
    expectedUpdatedAt: segment.updatedAt,
  })).data;
}
export async function transitionPurchaseRequestSegment(requestId, segment, action, reason) {
  return (await apiClient.post(
    `/purchase-requests/${requestId}/segments/${segment.id}/${action}`,
    { expectedUpdatedAt: segment.updatedAt, ...(reason ? { reason } : {}) },
  )).data;
}
export async function downloadPurchaseRequestSegmentPdf(requestId, segment) {
  const response = await apiClient.get(
    `/purchase-requests/${requestId}/segments/${segment.id}/pdf`,
    { responseType: 'blob', headers: { Accept: 'application/pdf' } },
  );
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `solicitud-${segment.code}-${segment.supplier.code}.pdf`;
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
