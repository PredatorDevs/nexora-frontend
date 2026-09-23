import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';
const page = lazyRoute(
  () => import('./pages/PurchaseListPage.jsx'),
  'PurchaseListPage',
);
export const purchaseRoutes = [
  {
    element: <RequirePermission permission={permissions.purchases.read} />,
    children: [{ path: routes.purchases, element: page }],
  },
];
