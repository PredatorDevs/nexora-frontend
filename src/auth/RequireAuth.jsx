import { Navigate, Outlet, useLocation } from 'react-router';

import { SessionLoading } from '@/auth/SessionLoading.jsx';
import { useAuth } from '@/auth/useAuth.js';
import { routes } from '@/app/routes.js';

export function RequireAuth() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <SessionLoading />;
  if (status === 'unauthenticated') {
    return <Navigate to={routes.login} replace state={{ from: location }} />;
  }
  if (user.mustChangePassword && location.pathname !== routes.changePassword) {
    return <Navigate to={routes.changePassword} replace />;
  }
  if (!user.mustChangePassword && location.pathname === routes.changePassword) {
    return <Navigate to={routes.profile} replace />;
  }

  return <Outlet />;
}
