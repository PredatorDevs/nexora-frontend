import { apiClient } from '@/api/api-client.js';
export async function listExpenseTypes(params) {
  const response = await apiClient.get('/expense-types', { params });
  return { expenseTypes: response.data, pagination: response.meta.pagination };
}
export async function getExpenseType(id) {
  return (await apiClient.get(`/expense-types/${id}`)).data;
}
export async function createExpenseType(data) {
  return (await apiClient.post('/expense-types', data)).data;
}
export async function updateExpenseType(id, data) {
  return (await apiClient.put(`/expense-types/${id}`, data)).data;
}
export async function changeExpenseTypeStatus(id, isActive, expectedUpdatedAt) {
  return (
    await apiClient.patch(`/expense-types/${id}/status`, {
      isActive,
      expectedUpdatedAt,
    })
  ).data;
}
