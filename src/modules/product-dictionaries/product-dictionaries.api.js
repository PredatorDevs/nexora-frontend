import { apiClient } from '@/api/api-client.js';
const catalog = (path, key) => ({
  async list(params) {
    const r = await apiClient.get(path, { params });
    return { [key]: r.data, pagination: r.meta.pagination };
  },
  async create(data) {
    return (await apiClient.post(path, data)).data;
  },
  async update(id, data) {
    return (await apiClient.put(`${path}/${id}`, data)).data;
  },
  async changeStatus(item, isActive) {
    return (
      await apiClient.patch(`${path}/${item.id}/status`, {
        isActive,
        expectedUpdatedAt: item.updatedAt,
      })
    ).data;
  },
});
export const brandsApi = catalog('/brands', 'brands');
export const productCategoriesApi = catalog(
  '/product-categories',
  'productCategories',
);
