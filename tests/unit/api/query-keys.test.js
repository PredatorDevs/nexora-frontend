import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/api/query-keys.js';

describe('queryKeys', () => {
  it('crea claves estables para listados y detalles administrativos', () => {
    const filters = { page: 1, pageSize: 20 };

    expect(queryKeys.users.list(filters)).toEqual(['users', 'list', filters]);
    expect(queryKeys.users.detail('7')).toEqual(['users', 'detail', 7]);
    expect(queryKeys.roles.list(filters)).toEqual(['roles', 'list', filters]);
    expect(queryKeys.roles.detail('4')).toEqual(['roles', 'detail', 4]);
    expect(queryKeys.permissions.list(filters)).toEqual([
      'permissions',
      'list',
      filters,
    ]);
    expect(queryKeys.sessions.list(filters)).toEqual([
      'sessions',
      'list',
      filters,
    ]);
    expect(queryKeys.audit.list(filters)).toEqual(['audit', 'list', filters]);
  });

  it('mantiene prefijos compatibles con invalidación por módulo', () => {
    expect(queryKeys.users.list({ page: 2 }).slice(0, 1)).toEqual(
      queryKeys.users.all,
    );
    expect(queryKeys.roles.detail(1).slice(0, 1)).toEqual(queryKeys.roles.all);
    expect(queryKeys.sessions.list({ activeOnly: true }).slice(0, 1)).toEqual(
      queryKeys.sessions.all,
    );
  });
});
