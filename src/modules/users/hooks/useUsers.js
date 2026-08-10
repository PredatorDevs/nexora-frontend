import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys.js';
import * as usersApi from '@/modules/users/users.api.js';

export function useUsers(filters) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => usersApi.listUsers(filters),
    placeholderData: (previous) => previous,
  });
}
export function useUser(id) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersApi.getUser(id),
    enabled: Number.isInteger(Number(id)) && Number(id) > 0,
  });
}
export function useRoleOptions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.roles.options,
    queryFn: usersApi.listRoleOptions,
    enabled,
    staleTime: 60_000,
  });
}
export function useUserMutations() {
  const client = useQueryClient();
  const refresh = (user) => {
    client.setQueryData(queryKeys.users.detail(user.id), user);
    return client.invalidateQueries({ queryKey: queryKeys.users.all });
  };
  return {
    create: useMutation({
      mutationFn: usersApi.createUser,
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, data }) => usersApi.updateUser(id, data),
      onSuccess: refresh,
    }),
    changeStatus: useMutation({
      mutationFn: ({ id, status, expectedUpdatedAt }) =>
        usersApi.changeUserStatus(id, status, expectedUpdatedAt),
      onSuccess: refresh,
    }),
    replaceRoles: useMutation({
      mutationFn: ({ id, roleIds, expectedUpdatedAt }) =>
        usersApi.replaceUserRoles(id, roleIds, expectedUpdatedAt),
      onSuccess: refresh,
    }),
    resetPassword: useMutation({
      mutationFn: ({ id, data }) => usersApi.resetUserPassword(id, data),
      onSuccess: refresh,
    }),
  };
}
