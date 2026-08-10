import { z } from 'zod';

export const sessionUserSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  displayName: z.string(),
});

export const sessionSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  userId: z.number().int().positive(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  expiresAt: z.string(),
  lastUsedAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
  revokedReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: sessionUserSchema,
});

export const sessionsSchema = z.array(sessionSchema);

export function getSessionStatus(session, now = new Date()) {
  if (session.revokedAt) return 'REVOKED';
  if (new Date(session.expiresAt) <= now) return 'EXPIRED';
  return 'ACTIVE';
}
