import { lazyRoute } from '@/app/lazy-route.jsx';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { routes } from '@/app/routes.js';
import { permissions } from '@/config/permissions.js';
const page = lazyRoute(
  () => import('./pages/ProductUnitListPage.jsx'),
  'ProductUnitListPage',
);
export const productUnitRoutes = [
  {
    element: <RequirePermission permission={permissions.productUnits.read} />,
    children: [{ path: routes.productUnits, element: page }],
  },
];
