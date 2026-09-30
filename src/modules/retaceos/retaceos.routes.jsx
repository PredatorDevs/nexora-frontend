import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';

const page = lazyRoute(
  () => import('./pages/RetaceoListPage.jsx'),
  'RetaceoListPage',
);
export const retaceoRoutes = [
  {
    element: <RequirePermission permission={permissions.retaceos.read} />,
    children: [{ path: routes.retaceos, element: page }],
  },
];
