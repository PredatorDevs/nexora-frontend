import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys.js';
import { listAuditLogs } from '@/modules/audit/audit.api.js';

export function useAuditLogs(filters) {
  return useQuery({
    queryKey: queryKeys.audit.list(filters),
    queryFn: () => listAuditLogs(filters),
    placeholderData: (previous) => previous,
  });
}
