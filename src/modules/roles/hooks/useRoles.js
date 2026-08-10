import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys.js';
import * as rolesApi from '@/modules/roles/roles.api.js';

export function useRoles(filters) {
  return useQuery({
    queryKey: queryKeys.roles.list(filters),
    queryFn: () => rolesApi.listRoles(filters),
    placeholderData: (previous) => previous,
  });
}

export function useRole(id) {
  return useQuery({
    queryKey: queryKeys.roles.detail(id),
    queryFn: () => rolesApi.getRole(id),
    enabled: Number.isInteger(Number(id)) && Number(id) > 0,
  });
}

export function useRoleMutations() {
  const client = useQueryClient();
  const refresh = (role) => {
    client.setQueryData(queryKeys.roles.detail(role.id), role);
    return client.invalidateQueries({ queryKey: queryKeys.roles.all });
  };
  return {
    create: useMutation({
      mutationFn: rolesApi.createRole,
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, data }) => rolesApi.updateRole(id, data),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: ({ id, expectedUpdatedAt }) =>
        rolesApi.deleteRole(id, expectedUpdatedAt),
      onSuccess: () =>
        client.invalidateQueries({ queryKey: queryKeys.roles.all }),
    }),
    replacePermissions: useMutation({
      mutationFn: ({ id, permissionCodes, expectedUpdatedAt }) =>
        rolesApi.replaceRolePermissions(id, permissionCodes, expectedUpdatedAt),
      onSuccess: refresh,
    }),
  };
}
