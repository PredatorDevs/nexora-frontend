import { lazyRoute } from '@/app/lazy-route.jsx';
import { routes } from '@/app/routes.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';
const page = lazyRoute(
  () => import('./pages/ExpenseTypeListPage.jsx'),
  'ExpenseTypeListPage',
);
export const expenseTypeRoutes = [
  {
    element: <RequirePermission permission={permissions.expenseTypes.read} />,
    children: [{ path: routes.expenseTypes, element: page }],
  },
];
