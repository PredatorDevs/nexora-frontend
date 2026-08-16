import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Modal, Space, Tag } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { queryKeys } from '@/api/query-keys.js';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { BranchForm } from '@/modules/branches/components/BranchForm.jsx';
import * as api from '@/modules/branches/branches.api.js';
const filters = { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' };
export function BranchListPage() {
  const { message } = App.useApp();
  const client = useQueryClient();
  const [modal, setModal] = useState(null);
  const query = useQuery({
    queryKey: queryKeys.branches.list(filters),
    queryFn: () => api.listBranches(filters),
  });
  const create = useMutation({ mutationFn: api.createBranch });
  const update = useMutation({
    mutationFn: ({ id, data }) => api.updateBranch(id, data),
  });
  const status = useMutation({
    mutationFn: ({ branch, next }) =>
      api.changeBranchStatus(branch.id, next, branch.updatedAt),
  });
  const refresh = useCallback(
    () => client.invalidateQueries({ queryKey: queryKeys.branches.all }),
    [client],
  );
  async function submit(data) {
    try {
      if (modal === 'create') {
        await create.mutateAsync(data);
        message.success('Sucursal creada.');
      } else {
        await update.mutateAsync({
          id: modal.id,
          data: { ...data, expectedUpdatedAt: modal.updatedAt },
        });
        message.success('Sucursal actualizada.');
      }
      await refresh();
      setModal(null);
    } catch (error) {
      message.error(error.message);
    }
  }
  const columns = useMemo(
    () => [
      { title: 'Código', dataIndex: 'code' },
      { title: 'Nombre', dataIndex: 'name' },
      {
        title: 'Tipo',
        render: (_, branch) =>
          branch.isHeadquarters ? (
            <Tag color="blue">Casa matriz</Tag>
          ) : (
            'Sucursal'
          ),
      },
      {
        title: 'Ubicación',
        render: (_, branch) =>
          [
            branch.district?.name,
            branch.municipality?.name,
            branch.department?.name,
          ]
            .filter(Boolean)
            .join(', '),
      },
      {
        title: 'Estado',
        dataIndex: 'status',
        render: (value) => <StatusBadge status={value} />,
      },
      {
        title: 'Acciones',
        render: (_, branch) => (
          <Space>
            <Can permission={permissions.branches.update}>
              <Button
                icon={<EditOutlined />}
                aria-label={`Editar ${branch.name}`}
                onClick={() => setModal(branch)}
              />
            </Can>
            <Can permission={permissions.branches.changeStatus}>
              <Button
                loading={status.isPending}
                onClick={async () => {
                  try {
                    await status.mutateAsync({
                      branch,
                      next: branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                    });
                    await refresh();
                    message.success('Estado actualizado.');
                  } catch (error) {
                    message.error(error.message);
                  }
                }}
              >
                {branch.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
              </Button>
            </Can>
          </Space>
        ),
      },
    ],
    [message, refresh, status],
  );
  return (
    <>
      <PageHeader
        title="Sucursales"
        description="Administra los puntos operativos de la empresa activa."
        extra={
          <Can permission={permissions.branches.create}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModal('create')}
            >
              Nueva sucursal
            </Button>
          </Can>
        }
      />
      <Card>
        <DataTable
          ariaLabel="Sucursales"
          columns={columns}
          dataSource={query.data?.branches}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
        />
      </Card>
      <Modal
        title={modal === 'create' ? 'Nueva sucursal' : 'Editar sucursal'}
        open={Boolean(modal)}
        footer={null}
        width={800}
        onCancel={() => setModal(null)}
        destroyOnHidden
      >
        {modal ? (
          <BranchForm
            key={modal === 'create' ? 'create' : modal.id}
            initialValues={modal === 'create' ? null : modal}
            isSubmitting={create.isPending || update.isPending}
            onCancel={() => setModal(null)}
            onSubmit={submit}
          />
        ) : null}
      </Modal>
    </>
  );
}
