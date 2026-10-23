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
