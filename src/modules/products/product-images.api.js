import { apiClient } from '@/api/api-client.js';

export async function listProductImages(productId) {
  return (await apiClient.get(`/products/${productId}/images`)).data;
}

export async function prepareProductImageUpload(file) {
  return (
    await apiClient.post('/files/image-upload', {
      purpose: 'PRODUCT_IMAGE',
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    })
  ).data;
}

export async function uploadToStorage(file, prepared) {
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
    throw new Error('S3 no pudo completar la carga de la imagen.');
}

export async function attachProductImage(productId, data) {
  return (await apiClient.post(`/products/${productId}/images`, data)).data;
}

export async function updateProductImage(productId, imageId, data) {
  return (await apiClient.put(`/products/${productId}/images/${imageId}`, data))
    .data;
}

export async function setPrimaryProductImage(productId, image) {
  return (
    await apiClient.patch(`/products/${productId}/images/${image.id}/primary`, {
      expectedUpdatedAt: image.updatedAt,
    })
  ).data;
}

export async function reorderProductImages(productId, imageIds) {
  return (
    await apiClient.put(`/products/${productId}/images/order`, { imageIds })
  ).data;
}

export async function deleteProductImage(productId, image) {
  return (
    await apiClient.delete(`/products/${productId}/images/${image.id}`, {
      data: { expectedUpdatedAt: image.updatedAt },
    })
  ).data;
}

export async function createFileReadUrl(storageKey) {
  return (await apiClient.post('/files/read-url', { storageKey })).data;
}
