import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';

const page = lazyRoute(
  () => import('@/modules/suppliers/pages/SupplierListPage.jsx'),
  'SupplierListPage',
);
export const supplierRoutes = [{
  element: <RequirePermission permission={permissions.suppliers.read} />,
  children: [{ path: routes.suppliers, element: page }],
}];
