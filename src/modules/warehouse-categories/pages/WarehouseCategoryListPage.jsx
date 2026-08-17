import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Modal, Space } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { queryKeys } from '@/api/query-keys.js';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { WarehouseCategoryForm } from '@/modules/warehouse-categories/components/WarehouseCategoryForm.jsx';
import * as api from '@/modules/warehouse-categories/warehouse-categories.api.js';

const filters = { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' };

export function WarehouseCategoryListPage() {
  const { message } = App.useApp();
  const client = useQueryClient();
  const [modal, setModal] = useState(null);
  const query = useQuery({
    queryKey: queryKeys.warehouseCategories.list(filters),
    queryFn: () => api.listWarehouseCategories(filters),
  });
  const create = useMutation({ mutationFn: api.createWarehouseCategory });
  const update = useMutation({ mutationFn: ({ id, data }) => api.updateWarehouseCategory(id, data) });
  const status = useMutation({
    mutationFn: ({ category, next }) =>
      api.changeWarehouseCategoryStatus(category.id, next, category.updatedAt),
  });
  const refresh = useCallback(
    () => client.invalidateQueries({ queryKey: queryKeys.warehouseCategories.all }),
    [client],
  );
  async function submit(data) {
    try {
      if (modal === 'create') {
        await create.mutateAsync(data);
        message.success('Categoría creada.');
      } else {
        await update.mutateAsync({ id: modal.id, data: { ...data, expectedUpdatedAt: modal.updatedAt } });
        message.success('Categoría actualizada.');
      }
      await refresh();
      setModal(null);
    } catch (error) {
      message.error(error.message);
    }
  }
  const columns = useMemo(() => [
    { title: 'Código', dataIndex: 'code' },
    { title: 'Nombre', dataIndex: 'name' },
    { title: 'Descripción', dataIndex: 'description' },
    {
      title: 'Estado',
      dataIndex: 'isActive',
      render: (value) => <StatusBadge status={value ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      title: 'Acciones',
      render: (_, category) => (
        <Space>
          <Can permission={permissions.warehouseCategories.update}>
            <Button icon={<EditOutlined />} aria-label={`Editar ${category.name}`} onClick={() => setModal(category)} />
          </Can>
          <Can permission={permissions.warehouseCategories.changeStatus}>
            <Button
              loading={status.isPending}
              onClick={async () => {
                try {
                  await status.mutateAsync({ category, next: !category.isActive });
                  await refresh();
                  message.success('Estado actualizado.');
                } catch (error) {
                  message.error(error.message);
                }
              }}
            >
              {category.isActive ? 'Desactivar' : 'Activar'}
            </Button>
          </Can>
        </Space>
      ),
    },
  ], [message, refresh, status]);

  return (
    <>
      <PageHeader
        title="Categorías de almacén"
        description="Clasifica los almacenes de la empresa activa según su propósito operativo."
        extra={(
          <Can permission={permissions.warehouseCategories.create}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal('create')}>
              Nueva categoría
            </Button>
          </Can>
        )}
      />
      <Card>
        <DataTable
          ariaLabel="Categorías de almacén"
          columns={columns}
          dataSource={query.data?.warehouseCategories}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
        />
      </Card>
      <Modal
        title={modal === 'create' ? 'Nueva categoría' : 'Editar categoría'}
        open={Boolean(modal)}
        footer={null}
        onCancel={() => setModal(null)}
        destroyOnHidden
      >
        {modal ? (
          <WarehouseCategoryForm
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
