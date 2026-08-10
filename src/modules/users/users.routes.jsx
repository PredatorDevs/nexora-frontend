import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { lazyRoute } from '@/app/lazy-route.jsx';
import { permissions } from '@/config/permissions.js';

const userListPage = lazyRoute(
  () => import('@/modules/users/pages/UserListPage.jsx'),
  'UserListPage',
);
const userDetailsPage = lazyRoute(
  () => import('@/modules/users/pages/UserDetailsPage.jsx'),
  'UserDetailsPage',
);
const userCreatePage = lazyRoute(
  () => import('@/modules/users/pages/UserCreatePage.jsx'),
  'UserCreatePage',
);
const userEditPage = lazyRoute(
  () => import('@/modules/users/pages/UserEditPage.jsx'),
  'UserEditPage',
);
export const userRoutes = [
  {
    element: <RequirePermission permission={permissions.users.read} />,
    children: [
      { path: '/users', element: userListPage },
      { path: '/users/:id', element: userDetailsPage },
    ],
  },
  {
    element: <RequirePermission permission={permissions.users.create} />,
    children: [{ path: '/users/create', element: userCreatePage }],
  },
  {
    element: <RequirePermission permission={permissions.users.update} />,
    children: [{ path: '/users/:id/edit', element: userEditPage }],
  },
];
