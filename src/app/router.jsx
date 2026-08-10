import { createBrowserRouter, Navigate } from 'react-router';

import { lazyRoute } from '@/app/lazy-route.jsx';
import { RequireAuth } from '@/auth/RequireAuth.jsx';
import { RequireGuest } from '@/auth/RequireGuest.jsx';
import { routes } from '@/app/routes.js';
import { AuthLayout } from '@/layouts/AuthLayout.jsx';
import { DashboardLayout } from '@/layouts/DashboardLayout.jsx';
import { auditRoutes } from '@/modules/audit/audit.routes.jsx';
import { permissionRoutes } from '@/modules/permissions/permissions.routes.jsx';
import { roleRoutes } from '@/modules/roles/roles.routes.jsx';
import { sessionRoutes } from '@/modules/sessions/sessions.routes.jsx';
import { userRoutes } from '@/modules/users/users.routes.jsx';

const loginPage = lazyRoute(
  () => import('@/modules/auth/pages/LoginPage.jsx'),
  'LoginPage',
);
const homePage = lazyRoute(
  () => import('@/modules/home/pages/HomePage.jsx'),
  'HomePage',
);
const accountPage = lazyRoute(
  () => import('@/modules/auth/pages/AccountPage.jsx'),
  'AccountPage',
);
const preferencesPage = lazyRoute(
  () => import('@/modules/preferences/pages/PreferencesPage.jsx'),
  'PreferencesPage',
);
const unauthorizedPage = lazyRoute(
  () => import('@/modules/errors/pages/UnauthorizedPage.jsx'),
  'UnauthorizedPage',
);
const notFoundPage = lazyRoute(
  () => import('@/modules/errors/pages/NotFoundPage.jsx'),
  'NotFoundPage',
);

export const appRoutes = [
  {
    element: <RequireGuest />,
    children: [
      {
        element: <AuthLayout />,
        children: [{ path: routes.login, element: loginPage }],
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: routes.home, element: homePage },
          { path: routes.profile, element: accountPage },
          { path: routes.changePassword, element: accountPage },
          { path: routes.preferences, element: preferencesPage },
          { path: routes.unauthorized, element: unauthorizedPage },
          ...userRoutes,
          ...roleRoutes,
          ...permissionRoutes,
          ...sessionRoutes,
          ...auditRoutes,
        ],
      },
    ],
  },
  {
    path: routes.notFound,
    element: notFoundPage,
  },
  {
    path: '*',
    element: <Navigate to={routes.notFound} replace />,
  },
];

export const router = createBrowserRouter(appRoutes);
