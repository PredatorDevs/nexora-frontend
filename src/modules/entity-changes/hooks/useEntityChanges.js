import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys.js';
import {
  getEntityChange,
  listEntityChanges,
} from '@/modules/entity-changes/entity-change.api.js';

export function useEntityChanges(filters) {
  return useQuery({
    queryKey: queryKeys.entityChanges.list(filters),
    queryFn: () => listEntityChanges(filters),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}

export function useEntityChange(id, enabled = true) {
  return useQuery({
    queryKey: queryKeys.entityChanges.detail(id),
    queryFn: () => getEntityChange(id),
    enabled: enabled && Boolean(id),
    staleTime: 5 * 60_000,
  });
}
