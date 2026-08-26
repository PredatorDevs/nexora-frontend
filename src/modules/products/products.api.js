import { apiClient } from '@/api/api-client.js';

export async function listProducts(params) {
  const response = await apiClient.get('/products', { params });
  return { products: response.data, pagination: response.meta.pagination };
}

export async function getProduct(id) {
  return (await apiClient.get(`/products/${id}`)).data;
}

export async function createProduct(data) {
  return (await apiClient.post('/products', data)).data;
}

export async function updateProduct(id, data) {
  return (await apiClient.put(`/products/${id}`, data)).data;
}

export async function changeProductStatus(product, isActive) {
  return (
    await apiClient.patch(`/products/${product.id}/status`, {
      isActive,
      expectedUpdatedAt: product.updatedAt,
    })
  ).data;
}
