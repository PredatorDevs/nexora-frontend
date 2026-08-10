import { Card, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { FilterBar } from '@/components/forms/FilterBar.jsx';
import { SearchInput } from '@/components/forms/SearchInput.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { usePermissions } from '@/modules/permissions/hooks/usePermissions.js';

function readFilters(params) {
  return {
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: Math.min(100, Math.max(1, Number(params.get('pageSize')) || 20)),
    search: params.get('search') || undefined,
    sortBy: params.get('sortBy') || 'code',
    sortOrder: params.get('sortOrder') === 'desc' ? 'desc' : 'asc',
  };
}

const columns = [
  {
    title: 'Código',
    dataIndex: 'code',
    key: 'code',
    sorter: true,
    render: (code) => <Typography.Text code>{code}</Typography.Text>,
  },
  {
    title: 'Recurso',
    dataIndex: 'resource',
    key: 'resource',
    sorter: true,
    render: (resource) => <Tag color="blue">{resource}</Tag>,
  },
  { title: 'Acción', dataIndex: 'action', key: 'action', sorter: true },
  {
    title: 'Descripción',
    dataIndex: 'description',
    key: 'description',
    render: (value) => value || '—',
  },
];

export function PermissionListPage() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const [search, setSearch] = useState(filters.search ?? '');
  const query = usePermissions(filters);
  function updateFilters(next) {
    const values = { ...filters, ...next };
    setParams(
      Object.fromEntries(
        Object.entries(values).filter(
          ([, value]) => value !== undefined && value !== '',
        ),
      ),
    );
  }
  return (
    <>
      <PageHeader
        title="Permisos"
        description="Catálogo de capacidades implementadas por el backend. Es de solo lectura."
      />
      <Card>
        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            onSearch={(value) =>
              updateFilters({ search: value || undefined, page: 1 })
            }
            placeholder="Buscar por código o recurso"
          />
        </FilterBar>
        <DataTable
          ariaLabel="Permisos"
          columns={columns}
          dataSource={query.data?.permissions}
          error={query.error}
          isLoading={query.isLoading || query.isFetching}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
          onChange={({ page, pageSize, sortBy, sortOrder }) =>
            updateFilters({
              page,
              pageSize,
              sortBy: sortBy ?? filters.sortBy,
              sortOrder: sortOrder ?? filters.sortOrder,
            })
          }
        />
      </Card>
    </>
  );
}
