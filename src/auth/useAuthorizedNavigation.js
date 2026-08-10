import { useMemo } from 'react';

import { filterNavigationItems } from '@/auth/navigation-utils.js';
import { useAuth } from '@/auth/useAuth.js';
import { navigationItems } from '@/config/navigation.js';

export function useAuthorizedNavigation() {
  const { permissions } = useAuth();

  return useMemo(
    () => filterNavigationItems(navigationItems, permissions),
    [permissions],
  );
}
