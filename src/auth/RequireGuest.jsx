import { Navigate, Outlet, useLocation } from 'react-router';

import { SessionLoading } from '@/auth/SessionLoading.jsx';
import { useAuth } from '@/auth/useAuth.js';
import { routes } from '@/app/routes.js';

function intendedDestination(location) {
  const from = location.state?.from;
  if (
    !from ||
    typeof from.pathname !== 'string' ||
    !from.pathname.startsWith('/') ||
    from.pathname === routes.login
  ) {
    return routes.home;
  }

  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
}

export function RequireGuest() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <SessionLoading />;
  if (status === 'authenticated') {
    return <Navigate to={intendedDestination(location)} replace />;
  }

  return <Outlet />;
}
