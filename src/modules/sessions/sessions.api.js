import { apiClient } from '@/api/api-client.js';
import { ApiError } from '@/api/api-error.js';
import {
  sessionSchema,
  sessionsSchema,
} from '@/modules/sessions/schemas/session.schemas.js';

function parse(schema, response) {
  const result = schema.safeParse(response.data);
  if (result.success) return result.data;
  throw new ApiError({
    code: 'INVALID_API_RESPONSE',
    message: 'El servidor devolvió sesiones no válidas.',
    status: response.status,
    requestId: response.meta.requestId,
    details: result.error.issues,
  });
}

export async function listSessions(filters) {
  const response = await apiClient.get('/sessions', { params: filters });
  return {
    sessions: parse(sessionsSchema, response),
    pagination: response.meta.pagination,
  };
}

export async function revokeSession(id) {
  const response = await apiClient.delete(`/sessions/${id}`);
  return parse(sessionSchema, response);
}
