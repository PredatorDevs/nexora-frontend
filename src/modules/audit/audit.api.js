import { apiClient } from '@/api/api-client.js';
import { ApiError } from '@/api/api-error.js';
import { auditLogsSchema } from '@/modules/audit/schemas/audit.schemas.js';

export async function listAuditLogs(filters) {
  const response = await apiClient.get('/audit', { params: filters });
  const result = auditLogsSchema.safeParse(response.data);
  if (!result.success) {
    throw new ApiError({
      code: 'INVALID_API_RESPONSE',
      message: 'El servidor devolvió eventos de auditoría no válidos.',
      status: response.status,
      requestId: response.meta.requestId,
      details: result.error.issues,
    });
  }
  return {
    logs: result.data,
    pagination: response.meta.pagination,
  };
}
