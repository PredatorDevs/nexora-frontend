import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';

const page = lazyRoute(
  () => import('./pages/PurchaseRequestListPage.jsx'),
  'PurchaseRequestListPage',
);
export const purchaseRequestRoutes = [
  {
    element: (
      <RequirePermission permission={permissions.purchaseRequests.read} />
    ),
    children: [{ path: routes.purchaseRequests, element: page }],
  },
];
