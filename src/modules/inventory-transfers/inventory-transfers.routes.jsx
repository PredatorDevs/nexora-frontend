import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';
const page = lazyRoute(() => import('./pages/InventoryTransferPage.jsx'), 'InventoryTransferPage');
export const inventoryTransferRoutes = [{
  element: <RequirePermission permission={permissions.inventory.read} />,
  children: [{ path: routes.inventoryTransfers, element: page }],
}];
