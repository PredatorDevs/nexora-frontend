import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { lazyRoute } from '@/app/lazy-route.jsx';
import { environment } from '@/config/environment.js';
import { permissions } from '@/config/permissions.js';

const auditListPage = lazyRoute(
  () => import('@/modules/audit/pages/AuditListPage.jsx'),
  'AuditListPage',
);
const entityChangeListPage = lazyRoute(
  () => import('@/modules/entity-changes/pages/EntityChangeListPage.jsx'),
  'EntityChangeListPage',
);

export const auditRoutes = environment.enableAuditModule
  ? [
      {
        element: <RequirePermission permission={permissions.audit.read} />,
        children: [
          { path: '/audit', element: auditListPage },
          { path: '/audit/entity-changes', element: entityChangeListPage },
        ],
      },
    ]
  : [];
