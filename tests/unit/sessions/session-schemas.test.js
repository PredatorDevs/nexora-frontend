import { describe, expect, it } from 'vitest';
import {
  getSessionStatus,
  sessionSchema,
} from '@/modules/sessions/schemas/session.schemas.js';

const session = {
  id: '0c12f11b-f429-45c4-b36a-c78bf36fdac0',
  familyId: '583c47ee-cf38-45f9-890c-728efe1cd26b',
  userId: 4,
  ipAddress: '127.0.0.1',
  userAgent: 'Test browser',
  expiresAt: '2026-08-20T12:00:00.000Z',
  lastUsedAt: null,
  revokedAt: null,
  revokedReason: null,
  createdAt: '2026-07-20T12:00:00.000Z',
  updatedAt: '2026-07-20T12:00:00.000Z',
  user: {
    id: 4,
    email: 'user@example.com',
    displayName: 'User',
  },
};

describe('session schemas', () => {
  it('valida una sesión pública sin datos sensibles', () => {
    expect(sessionSchema.safeParse(session).success).toBe(true);
  });

  it('deriva el estado activo, expirado o revocado', () => {
    const now = new Date('2026-07-21T12:00:00.000Z');
    expect(getSessionStatus(session, now)).toBe('ACTIVE');
    expect(
      getSessionStatus(
        { ...session, expiresAt: '2026-07-20T11:00:00.000Z' },
        now,
      ),
    ).toBe('EXPIRED');
    expect(
      getSessionStatus(
        {
          ...session,
          revokedAt: '2026-07-20T10:00:00.000Z',
          expiresAt: '2026-08-20T12:00:00.000Z',
        },
        now,
      ),
    ).toBe('REVOKED');
  });
});
