import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';
const page = lazyRoute(
  () => import('@/modules/branches/pages/BranchListPage.jsx'),
  'BranchListPage',
);
export const branchRoutes = [
  {
    element: <RequirePermission permission={permissions.branches.read} />,
    children: [{ path: routes.branches, element: page }],
  },
];
