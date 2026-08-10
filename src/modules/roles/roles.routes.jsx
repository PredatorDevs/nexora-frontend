import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { lazyRoute } from '@/app/lazy-route.jsx';
import { permissions } from '@/config/permissions.js';

const roleListPage = lazyRoute(
  () => import('@/modules/roles/pages/RoleListPage.jsx'),
  'RoleListPage',
);
const roleDetailsPage = lazyRoute(
  () => import('@/modules/roles/pages/RoleDetailsPage.jsx'),
  'RoleDetailsPage',
);
const roleCreatePage = lazyRoute(
  () => import('@/modules/roles/pages/RoleCreatePage.jsx'),
  'RoleCreatePage',
);
const roleEditPage = lazyRoute(
  () => import('@/modules/roles/pages/RoleEditPage.jsx'),
  'RoleEditPage',
);

export const roleRoutes = [
  {
    element: <RequirePermission permission={permissions.roles.read} />,
    children: [
      { path: '/roles', element: roleListPage },
      { path: '/roles/:id', element: roleDetailsPage },
    ],
  },
  {
    element: <RequirePermission permission={permissions.roles.create} />,
    children: [{ path: '/roles/create', element: roleCreatePage }],
  },
  {
    element: <RequirePermission permission={permissions.roles.update} />,
    children: [{ path: '/roles/:id/edit', element: roleEditPage }],
  },
];
