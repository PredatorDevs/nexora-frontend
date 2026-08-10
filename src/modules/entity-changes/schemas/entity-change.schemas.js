import { z } from 'zod';

const jsonValue = z.json().nullable();

export const entityChangeSummarySchema = z.object({
  id: z.string().regex(/^\d+$/),
  schemaName: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  source: z.enum([
    'APPLICATION',
    'SYSTEM_JOB',
    'MIGRATION',
    'DATABASE_TRIGGER',
  ]),
  actorUserId: z.number().int().positive().nullable(),
  requestId: z.string(),
  changedFields: jsonValue,
  metadata: jsonValue,
  createdAt: z.string(),
});

export const entityChangeSummariesSchema = z.array(entityChangeSummarySchema);

export const entityChangeDetailSchema = entityChangeSummarySchema.extend({
  oldValues: jsonValue,
  newValues: jsonValue,
});
