import { apiClient } from '@/api/api-client.js';

export async function listLocations(params) {
  const response = await apiClient.get('/locations', { params });
  return { locations: response.data, pagination: response.meta.pagination };
}
export async function createLocation(data) {
  return (await apiClient.post('/locations', data)).data;
}
export async function updateLocation(id, data) {
  return (await apiClient.put(`/locations/${id}`, data)).data;
}
export async function changeLocationStatus(id, isActive, expectedUpdatedAt) {
  return (await apiClient.patch(`/locations/${id}/status`, { isActive, expectedUpdatedAt })).data;
}
