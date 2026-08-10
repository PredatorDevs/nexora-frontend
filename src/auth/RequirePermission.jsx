import { Navigate, Outlet, useLocation } from 'react-router';

import { routes } from '@/app/routes.js';
import { matchesPermissionRequirement } from '@/auth/permission-utils.js';
import { SessionLoading } from '@/auth/SessionLoading.jsx';
import { useAuth } from '@/auth/useAuth.js';

export function RequirePermission({ permission, anyOf, allOf, children }) {
  const { permissions: effectivePermissions, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <SessionLoading />;
  if (status === 'unauthenticated') {
    return <Navigate to={routes.login} replace state={{ from: location }} />;
  }

  const allowed = matchesPermissionRequirement(effectivePermissions, {
    permission,
    anyOf,
    allOf,
  });

  if (!allowed) {
    return (
      <Navigate to={routes.unauthorized} replace state={{ from: location }} />
    );
  }

  return children ?? <Outlet />;
}
