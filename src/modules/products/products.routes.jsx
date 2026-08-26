import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';

const productListPage = lazyRoute(
  () => import('./pages/ProductListPage.jsx'),
  'ProductListPage',
);

export const productRoutes = [
  {
    element: <RequirePermission permission={permissions.products.read} />,
    children: [{ path: routes.products, element: productListPage }],
  },
];
