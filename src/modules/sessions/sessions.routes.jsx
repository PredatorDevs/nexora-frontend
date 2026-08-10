import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { lazyRoute } from '@/app/lazy-route.jsx';
import { permissions } from '@/config/permissions.js';

const sessionListPage = lazyRoute(
  () => import('@/modules/sessions/pages/SessionListPage.jsx'),
  'SessionListPage',
);

export const sessionRoutes = [
  {
    element: <RequirePermission permission={permissions.sessions.read} />,
    children: [{ path: '/sessions', element: sessionListPage }],
  },
];
