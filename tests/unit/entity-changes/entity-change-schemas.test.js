import { describe, expect, it } from 'vitest';

import {
  entityChangeDetailSchema,
  entityChangeSummarySchema,
} from '@/modules/entity-changes/schemas/entity-change.schemas.js';

const summary = {
  id: '18446744073709551615',
  schemaName: 'administration',
  entityType: 'user',
  entityId: '9',
  operation: 'UPDATE',
  source: 'APPLICATION',
  actorUserId: 3,
  requestId: 'request-123',
  changedFields: ['status'],
  metadata: { reason: 'STATUS_CHANGE' },
  createdAt: '2026-07-24T12:00:00.000Z',
};

describe('entity change schemas', () => {
  it('keeps bigint identifiers serialized as text', () => {
    expect(entityChangeSummarySchema.parse(summary).id).toBe(summary.id);
  });

  it('requires snapshots only in the detail contract', () => {
    expect(
      entityChangeDetailSchema.safeParse({
        ...summary,
        oldValues: { status: 'ACTIVE' },
        newValues: { status: 'INACTIVE' },
      }).success,
    ).toBe(true);
    expect(entityChangeDetailSchema.safeParse(summary).success).toBe(false);
  });
});
