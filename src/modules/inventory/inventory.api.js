import { apiClient } from '@/api/api-client.js';

export async function listEligibleReceipts(search) {
  return (await apiClient.get('/inventory/eligible-receipts', {
    params: search ? { search } : undefined,
  })).data;
}

export async function postReceipt(item) {
  return (await apiClient.post(`/inventory/receipts/${item.id}/post`, {
    expectedUpdatedAt: item.updatedAt,
  })).data;
}

export async function listLots(params) {
  const response = await apiClient.get('/inventory/lots', { params });
  return { lots: response.data, pagination: response.meta.pagination };
}
export async function getLot(id) {
  return (await apiClient.get(`/inventory/lots/${id}`)).data;
}
export async function assignLocation(lotId, data) {
  return (await apiClient.post(`/inventory/lots/${lotId}/locations`, data)).data;
}
export async function printLabels(lot, data) {
  const response = await apiClient.post(`/inventory/lots/${lot.id}/labels`, data, {
    responseType: 'blob', headers: { Accept: 'application/pdf' },
  });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `etiquetas-${lot.code}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
