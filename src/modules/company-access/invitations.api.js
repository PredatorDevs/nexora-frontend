import { apiClient } from '@/api/api-client.js';
export async function previewInvitation(token) {
  return (await apiClient.get(`/invitations/${encodeURIComponent(token)}`)).data;
}
export async function acceptInvitation(token, data) {
  return (await apiClient.post(`/invitations/${encodeURIComponent(token)}/accept`, data)).data;
}
