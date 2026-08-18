import { lazyRoute } from '@/app/lazy-route.jsx';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { routes } from '@/app/routes.js';
import { permissions } from '@/config/permissions.js';
const brandPage = lazyRoute(
  () => import('./pages/ProductDictionaryPage.jsx'),
  'BrandListPage',
);
const categoryPage = lazyRoute(
  () => import('./pages/ProductDictionaryPage.jsx'),
  'ProductCategoryListPage',
);
export const productDictionaryRoutes = [
  {
    element: <RequirePermission permission={permissions.brands.read} />,
    children: [{ path: routes.brands, element: brandPage }],
  },
  {
    element: (
      <RequirePermission permission={permissions.productCategories.read} />
    ),
    children: [{ path: routes.productCategories, element: categoryPage }],
  },
];
