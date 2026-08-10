import { Breadcrumb } from 'antd';
import { Link, useLocation } from 'react-router';

import { routes } from '@/app/routes.js';
import { useAuthorizedNavigation } from '@/auth/useAuthorizedNavigation.js';

function flatten(items) {
  return items.flatMap((item) => [item, ...flatten(item.children ?? [])]);
}

export function Breadcrumbs() {
  const location = useLocation();
  const navigation = useAuthorizedNavigation();
  const current = flatten(navigation).find(
    (item) => item.path === location.pathname,
  );
  const currentLabel =
    current?.label ??
    (location.pathname === routes.unauthorized ? 'Sin autorización' : null);

  const items =
    location.pathname === routes.home
      ? [{ title: 'Inicio' }]
      : [
          { title: <Link to={routes.home}>Inicio</Link> },
          ...(currentLabel ? [{ title: currentLabel }] : []),
        ];

  return <Breadcrumb aria-label="Ruta de navegación" items={items} />;
}
