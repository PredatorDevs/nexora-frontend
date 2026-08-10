import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { lazyRoute } from '@/app/lazy-route.jsx';
import { permissions } from '@/config/permissions.js';

const permissionListPage = lazyRoute(
  () => import('@/modules/permissions/pages/PermissionListPage.jsx'),
  'PermissionListPage',
);

export const permissionRoutes = [
  {
    element: <RequirePermission permission={permissions.permissions.read} />,
    children: [{ path: '/permissions', element: permissionListPage }],
  },
];
