import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';
const page = lazyRoute(
  () => import('./pages/PurchaseQuotationListPage.jsx'),
  'PurchaseQuotationListPage',
);
export const purchaseQuotationRoutes = [
  {
    element: (
      <RequirePermission permission={permissions.purchaseQuotations.read} />
    ),
    children: [{ path: routes.purchaseQuotations, element: page }],
  },
];
