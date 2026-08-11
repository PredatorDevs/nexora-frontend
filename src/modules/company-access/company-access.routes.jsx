import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';

const page = lazyRoute(
  () =>
    import('@/modules/company-access/pages/CompanyAccessManagementPage.jsx'),
  'CompanyAccessManagementPage',
);
export const companyAccessRoutes = [
  {
    element: <RequirePermission permission={permissions.companyMembers.read} />,
    children: [{ path: routes.companyAccess, element: page }],
  },
];
