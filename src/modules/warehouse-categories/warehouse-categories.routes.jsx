import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';

const page = lazyRoute(
  () => import('@/modules/warehouse-categories/pages/WarehouseCategoryListPage.jsx'),
  'WarehouseCategoryListPage',
);
export const warehouseCategoryRoutes = [{
  element: <RequirePermission permission={permissions.warehouseCategories.read} />,
  children: [{ path: routes.warehouseCategories, element: page }],
}];
