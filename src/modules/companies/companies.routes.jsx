import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';

const list = lazyRoute(
  () => import('@/modules/companies/pages/CompanyManagementPage.jsx'),
  'CompanyManagementPage',
);
export const companyRoutes = [
  {
    element: <RequirePermission permission={permissions.companies.read} />,
    children: [{ path: routes.companies, element: list }],
  },
];
