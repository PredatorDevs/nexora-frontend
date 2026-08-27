import { apiClient } from '@/api/api-client.js';

export async function listSuppliers(params) {
  const response = await apiClient.get('/suppliers', { params });
  return { suppliers: response.data, pagination: response.meta.pagination };
}
export async function getSupplier(id) {
  return (await apiClient.get(`/suppliers/${id}`)).data;
}
export async function createSupplier(data) {
  return (await apiClient.post('/suppliers', data)).data;
}
export async function updateSupplier(id, data) {
  return (await apiClient.put(`/suppliers/${id}`, data)).data;
}
export async function changeSupplierStatus(id, isActive, expectedUpdatedAt) {
  return (await apiClient.patch(`/suppliers/${id}/status`, { isActive, expectedUpdatedAt })).data;
}
export async function listSupplierContacts(supplierId, params) {
  const response = await apiClient.get(`/suppliers/${supplierId}/contacts`, { params });
  return { contacts: response.data, pagination: response.meta.pagination };
}
export async function getSupplierContact(supplierId, contactId) {
  return (await apiClient.get(`/suppliers/${supplierId}/contacts/${contactId}`)).data;
}
export async function createSupplierContact(supplierId, data) {
  return (await apiClient.post(`/suppliers/${supplierId}/contacts`, data)).data;
}
export async function updateSupplierContact(supplierId, contactId, data) {
  return (await apiClient.put(`/suppliers/${supplierId}/contacts/${contactId}`, data)).data;
}
export async function changeSupplierContactStatus(supplierId, contactId, isActive, expectedUpdatedAt) {
  return (await apiClient.patch(`/suppliers/${supplierId}/contacts/${contactId}/status`, { isActive, expectedUpdatedAt })).data;
}
export async function setPrimarySupplierContact(supplierId, contactId, expectedUpdatedAt) {
  return (await apiClient.patch(`/suppliers/${supplierId}/contacts/${contactId}/primary`, { expectedUpdatedAt })).data;
}
