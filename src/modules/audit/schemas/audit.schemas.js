import { z } from 'zod';

export const auditLogSchema = z.object({
  id: z.string().regex(/^\d+$/),
  actorUserId: z.number().int().positive().nullable(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  result: z.enum(['SUCCESS', 'FAILURE']),
  requestId: z.string(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  metadata: z.json().nullable(),
  createdAt: z.string(),
});

export const auditLogsSchema = z.array(auditLogSchema);
