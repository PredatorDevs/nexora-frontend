import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';

const page = lazyRoute(() => import('./pages/InventoryAdjustmentPage.jsx'), 'InventoryAdjustmentPage');
export const inventoryAdjustmentRoutes = [{
  element: <RequirePermission permission={permissions.inventory.read} />,
  children: [{ path: routes.inventoryAdjustments, element: page }],
}];
