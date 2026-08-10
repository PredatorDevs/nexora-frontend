import { describe, expect, it } from 'vitest';
import { auditLogSchema } from '@/modules/audit/schemas/audit.schemas.js';

const event = {
  id: '18446744073709551615',
  actorUserId: 3,
  action: 'USER.STATUS_CHANGED',
  resourceType: 'user',
  resourceId: '9',
  result: 'SUCCESS',
  requestId: 'request-123',
  ipAddress: '127.0.0.1',
  userAgent: 'Test browser',
  metadata: { status: 'INACTIVE', fields: ['status'] },
  createdAt: '2026-07-20T12:00:00.000Z',
};

describe('audit schemas', () => {
  it('conserva el id bigint serializado como texto y metadatos JSON', () => {
    const result = auditLogSchema.safeParse(event);
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('18446744073709551615');
  });

  it('admite eventos anónimos sin recurso concreto ni metadatos', () => {
    expect(
      auditLogSchema.safeParse({
        ...event,
        actorUserId: null,
        resourceId: null,
        metadata: null,
      }).success,
    ).toBe(true);
  });

  it('rechaza resultados fuera del contrato', () => {
    expect(
      auditLogSchema.safeParse({ ...event, result: 'PENDING' }).success,
    ).toBe(false);
  });
});
