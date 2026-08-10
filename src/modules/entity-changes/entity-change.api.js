import { apiClient } from '@/api/api-client.js';
import { ApiError } from '@/api/api-error.js';
import {
  entityChangeDetailSchema,
  entityChangeSummariesSchema,
} from '@/modules/entity-changes/schemas/entity-change.schemas.js';

function invalidResponse(response, issues) {
  return new ApiError({
    code: 'INVALID_API_RESPONSE',
    message: 'El servidor devolvió un historial de cambios no válido.',
    status: response.status,
    requestId: response.meta.requestId,
    details: issues,
  });
}

export async function listEntityChanges(filters) {
  const response = await apiClient.get('/entity-changes', { params: filters });
  const result = entityChangeSummariesSchema.safeParse(response.data);
  if (!result.success) throw invalidResponse(response, result.error.issues);
  return {
    changes: result.data,
    pagination: response.meta.pagination,
    range: response.meta.range,
  };
}

export async function getEntityChange(id) {
  const response = await apiClient.get(`/entity-changes/${id}`);
  const result = entityChangeDetailSchema.safeParse(response.data);
  if (!result.success) throw invalidResponse(response, result.error.issues);
  return result.data;
}
