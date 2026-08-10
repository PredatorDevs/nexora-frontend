import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys.js';
import * as sessionsApi from '@/modules/sessions/sessions.api.js';

export function useSessions(filters) {
  return useQuery({
    queryKey: queryKeys.sessions.list(filters),
    queryFn: () => sessionsApi.listSessions(filters),
    placeholderData: (previous) => previous,
  });
}

export function useSessionMutations() {
  const client = useQueryClient();
  return {
    revoke: useMutation({
      mutationFn: sessionsApi.revokeSession,
      onSuccess: () =>
        client.invalidateQueries({ queryKey: queryKeys.sessions.all }),
    }),
  };
}
