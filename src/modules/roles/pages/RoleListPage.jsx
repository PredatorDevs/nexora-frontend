import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { App, Button, Card, Space, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { routes } from '@/app/routes.js';
import { Can } from '@/components/authorization/Can.jsx';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog.jsx';
import { FilterBar } from '@/components/forms/FilterBar.jsx';
import { SearchInput } from '@/components/forms/SearchInput.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { permissions } from '@/config/permissions.js';
import { useRoleMutations, useRoles } from '@/modules/roles/hooks/useRoles.js';

function readFilters(params) {
  return {
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: Math.min(100, Math.max(1, Number(params.get('pageSize')) || 20)),
    search: params.get('search') || undefined,
    sortBy: params.get('sortBy') || 'name',
    sortOrder: params.get('sortOrder') === 'desc' ? 'desc' : 'asc',
  };
}

export function RoleListPage() {
  const { message } = App.useApp();
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const [search, setSearch] = useState(filters.search ?? '');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const query = useRoles(filters);
  const { remove } = useRoleMutations();
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
  const columns = useMemo(
    () => [
      { title: 'Nombre', dataIndex: 'name', key: 'name', sorter: true },
      {
        title: 'Código',
        dataIndex: 'code',
        key: 'code',
        sorter: true,
        render: (code) => <Tag>{code}</Tag>,
      },
      {
        title: 'Tipo',
        dataIndex: 'isSystem',
        key: 'isSystem',
        sorter: true,
        render: (isSystem) => (
          <Tag color={isSystem ? 'blue' : 'default'}>
            {isSystem ? 'Sistema' : 'Personalizado'}
          </Tag>
        ),
      },
      {
        title: 'Permisos',
        key: 'permissions',
        render: (_, role) => role.permissions.length,
      },
      {
        title: 'Acciones',
        key: 'actions',
        render: (_, role) => (
          <Space>
            <Link
              aria-label={`Ver ${role.name}`}
              to={`${routes.roles}/${role.id}`}
            >
              <Button icon={<EyeOutlined />} />
            </Link>
            <Can permission={permissions.roles.update}>
              <Link
                aria-label={`Editar ${role.name}`}
                to={`${routes.roles}/${role.id}/edit`}
              >
                <Button icon={<EditOutlined />} />
              </Link>
            </Can>
            <Can permission={permissions.roles.delete}>
              <Button
                danger
                disabled={role.isSystem}
                title={
                  role.isSystem
                    ? 'Los roles del sistema no se pueden eliminar.'
                    : undefined
                }
                icon={<DeleteOutlined />}
                onClick={() => setDeleteTarget(role)}
              />
            </Can>
          </Space>
        ),
      },
    ],
    [],
  );
  return (
    <>
      <PageHeader
        title="Roles"
        description="Agrupa permisos para asignarlos a los usuarios."
        extra={
          <Can permission={permissions.roles.create}>
            <Button type="primary" icon={<PlusOutlined />}>
              <Link to={`${routes.roles}/create`}>Nuevo rol</Link>
            </Button>
          </Can>
        }
      />
      <Card>
        <FilterBar>
          <SearchInput
            value={search}
            onChange={setSearch}
            onSearch={(value) =>
              updateFilters({ search: value || undefined, page: 1 })
            }
            placeholder="Buscar por nombre o código"
          />
        </FilterBar>
        <DataTable
          ariaLabel="Roles"
          columns={columns}
          dataSource={query.data?.roles}
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
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar rol"
        description={`Se eliminará permanentemente el rol “${deleteTarget?.name ?? ''}”.`}
        confirmText="Eliminar"
        danger
        confirmationPhrase={deleteTarget?.code}
        isConfirming={remove.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          try {
            await remove.mutateAsync({
              id: deleteTarget.id,
              expectedUpdatedAt: deleteTarget.updatedAt,
            });
            message.success('Rol eliminado.');
            setDeleteTarget(null);
          } catch (error) {
            message.error(error.message);
          }
        }}
      />
    </>
  );
}
