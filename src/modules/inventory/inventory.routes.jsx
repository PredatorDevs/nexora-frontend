import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';

const page = lazyRoute(
  () => import('./pages/InventoryReceiptPage.jsx'),
  'InventoryReceiptPage',
);
export const inventoryRoutes = [{
  element: <RequirePermission permission={permissions.inventory.receive} />,
  children: [{ path: routes.inventoryReceipts, element: page }],
}];
