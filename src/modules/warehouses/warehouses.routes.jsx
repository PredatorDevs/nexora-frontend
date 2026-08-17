import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';

const page = lazyRoute(
  () => import('@/modules/warehouses/pages/WarehouseListPage.jsx'),
  'WarehouseListPage',
);
export const warehouseRoutes = [{
  element: <RequirePermission permission={permissions.warehouses.read} />,
  children: [{ path: routes.warehouses, element: page }],
}];
