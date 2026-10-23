import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';

const page = lazyRoute(
  () => import('./pages/InventoryReceiptPage.jsx'),
  'InventoryReceiptPage',
);
const lotsPage = lazyRoute(
  () => import('./pages/InventoryLotPage.jsx'),
  'InventoryLotPage',
);
const overviewPage = lazyRoute(
  () => import('./pages/InventoryOverviewPage.jsx'),
  'InventoryOverviewPage',
);
export const inventoryRoutes = [
  {
    element: <RequirePermission permission={permissions.inventory.read} />,
    children: [{ path: routes.inventory, element: overviewPage }],
  },
  {
    element: <RequirePermission permission={permissions.inventory.receive} />,
    children: [{ path: routes.inventoryReceipts, element: page }],
  },
  {
    element: <RequirePermission permission={permissions.inventory.lotsRead} />,
    children: [{ path: routes.inventoryLots, element: lotsPage }],
  },
];
