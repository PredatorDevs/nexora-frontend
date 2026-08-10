import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys.js';
import * as permissionsApi from '@/modules/permissions/permissions.api.js';

export function usePermissions(filters) {
  return useQuery({
    queryKey: queryKeys.permissions.list(filters),
    queryFn: () => permissionsApi.listPermissions(filters),
    placeholderData: (previous) => previous,
  });
}

export function usePermissionCatalog(enabled = true) {
  return useQuery({
    queryKey: queryKeys.permissions.catalog,
    queryFn: permissionsApi.getPermissionCatalog,
    enabled,
    staleTime: 60_000,
  });
}
