import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';

const page = lazyRoute(
  () => import('@/modules/locations/pages/LocationListPage.jsx'),
  'LocationListPage',
);
export const locationRoutes = [{
  element: <RequirePermission permission={permissions.locations.read} />,
  children: [{ path: routes.locations, element: page }],
}];
