import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Space } from 'antd';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { routes } from '@/app/routes.js';
import { useAuth } from '@/auth/useAuth.js';
import { Can } from '@/components/authorization/Can.jsx';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog.jsx';
import { FilterBar } from '@/components/forms/FilterBar.jsx';
import { SearchInput } from '@/components/forms/SearchInput.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { useUserMutations, useUsers } from '@/modules/users/hooks/useUsers.js';

function readFilters(params) {
  return {
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: Math.min(100, Math.max(1, Number(params.get('pageSize')) || 20)),
    search: params.get('search') || undefined,
    sortBy: params.get('sortBy') || 'createdAt',
    sortOrder: params.get('sortOrder') === 'asc' ? 'asc' : 'desc',
  };
}
export function UserListPage() {
  const { user: currentUser } = useAuth();
  const { message } = App.useApp();
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const [search, setSearch] = useState(filters.search ?? '');
  const [statusTarget, setStatusTarget] = useState(null);
  const query = useUsers(filters);
  const { changeStatus } = useUserMutations();
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
  async function confirmStatus() {
    const nextStatus = statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await changeStatus.mutateAsync({
        id: statusTarget.id,
        status: nextStatus,
        expectedUpdatedAt: statusTarget.updatedAt,
      });
      message.success('Estado actualizado.');
      setStatusTarget(null);
    } catch (error) {
      message.error(error.message);
    }
  }
  const columns = useMemo(
    () => [
      {
        title: 'Nombre',
        dataIndex: 'displayName',
        key: 'displayName',
        sorter: true,
      },
      { title: 'Correo', dataIndex: 'email', key: 'email', sorter: true },
      {
        title: 'Estado',
        dataIndex: 'status',
        key: 'status',
        sorter: true,
        render: (status) => <StatusBadge status={status} />,
      },
      {
        title: 'Roles',
        key: 'roles',
        render: (_, user) =>
          user.roles.map(({ role }) => role.name).join(', ') || 'Sin roles',
      },
      {
        title: 'Acciones',
        key: 'actions',
        render: (_, user) => (
          <Space>
            <Link
              aria-label={`Ver ${user.displayName}`}
              to={`${routes.users}/${user.id}`}
            >
              <Button icon={<EyeOutlined />} />
            </Link>
            <Can permission={permissions.users.update}>
              <Link
                aria-label={`Editar ${user.displayName}`}
                to={`${routes.users}/${user.id}/edit`}
              >
                <Button icon={<EditOutlined />} />
              </Link>
            </Can>
            <Can permission={permissions.users.changeStatus}>
              <Button
                disabled={currentUser.id === user.id}
                title={
                  currentUser.id === user.id
                    ? 'No puedes cambiar tu propio estado.'
                    : undefined
                }
                onClick={() => setStatusTarget(user)}
              >
                {user.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
              </Button>
            </Can>
          </Space>
        ),
      },
    ],
    [currentUser.id],
  );
  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Administra identidades, estado y roles."
        extra={
          <Can permission={permissions.users.create}>
            <Button type="primary" icon={<PlusOutlined />}>
              <Link to={`${routes.users}/create`}>Nuevo usuario</Link>
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
            placeholder="Buscar por nombre o correo"
          />
        </FilterBar>
        <DataTable
          ariaLabel="Usuarios"
          columns={columns}
          dataSource={query.data?.users}
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
        open={Boolean(statusTarget)}
        title={`${statusTarget?.status === 'ACTIVE' ? 'Desactivar' : 'Activar'} usuario`}
        description={
          statusTarget?.status === 'ACTIVE'
            ? 'Se revocarán inmediatamente todas sus sesiones activas.'
            : 'El usuario podrá volver a iniciar sesión.'
        }
        confirmText={
          statusTarget?.status === 'ACTIVE' ? 'Desactivar' : 'Activar'
        }
        danger={statusTarget?.status === 'ACTIVE'}
        isConfirming={changeStatus.isPending}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatus}
      />
    </>
  );
}
