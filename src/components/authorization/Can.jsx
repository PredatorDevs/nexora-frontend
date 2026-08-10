import { useAuth } from '@/auth/useAuth.js';
import { matchesPermissionRequirement } from '@/auth/permission-utils.js';

export function Can({ permission, anyOf, allOf, fallback = null, children }) {
  const { permissions } = useAuth();
  const allowed = matchesPermissionRequirement(permissions, {
    permission,
    anyOf,
    allOf,
  });

  return allowed ? children : fallback;
}
