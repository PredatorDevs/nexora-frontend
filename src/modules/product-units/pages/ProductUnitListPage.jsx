import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Modal, Space, Tag } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { ProductUnitForm } from '../components/ProductUnitForm.jsx';
import * as api from '../product-units.api.js';
const filters = { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' };
export function ProductUnitListPage() {
  const { message } = App.useApp(),
    client = useQueryClient();
  const [modal, setModal] = useState(null);
  const query = useQuery({
    queryKey: ['product-units', 'list', filters],
    queryFn: () => api.listProductUnits(filters),
  });
  const create = useMutation({ mutationFn: api.createProductUnit }),
    update = useMutation({
      mutationFn: ({ id, data }) => api.updateProductUnit(id, data),
    }),
    status = useMutation({
      mutationFn: ({ item, next }) => api.changeProductUnitStatus(item, next),
    });
  const refresh = useCallback(
    () => client.invalidateQueries({ queryKey: ['product-units'] }),
    [client],
  );
  async function submit(data) {
    try {
      if (modal === 'create') await create.mutateAsync(data);
      else
        await update.mutateAsync({
          id: modal.id,
          data: { ...data, expectedUpdatedAt: modal.updatedAt },
        });
      await refresh();
      setModal(null);
      message.success('Unidad comercial guardada.');
    } catch (error) {
      message.error(error.message);
    }
  }
  const columns = useMemo(
    () => [
      { title: 'Código', dataIndex: 'code' },
      { title: 'Nombre comercial', dataIndex: 'name' },
      {
        title: 'Uso',
        dataIndex: 'type',
        render: (v) => (
          <Tag color={v === 'PURCHASE' ? 'blue' : 'green'}>
            {v === 'PURCHASE' ? 'Compra' : 'Venta'}
          </Tag>
        ),
      },
      {
        title: 'Unidad base',
        render: (_, x) =>
          `${x.measurementUnit.name}${x.measurementUnit.symbol ? ` (${x.measurementUnit.symbol})` : ''}`,
      },
      {
        title: 'Estado',
        dataIndex: 'isActive',
        render: (v) => <StatusBadge status={v ? 'ACTIVE' : 'INACTIVE'} />,
      },
      {
        title: 'Acciones',
        render: (_, item) => (
          <Space>
            <Can permission={permissions.productUnits.update}>
              <Button icon={<EditOutlined />} onClick={() => setModal(item)} />
            </Can>
            <Can permission={permissions.productUnits.changeStatus}>
              <Button
                loading={status.isPending}
                onClick={async () => {
                  try {
                    await status.mutateAsync({ item, next: !item.isActive });
                    await refresh();
                    message.success('Estado actualizado.');
                  } catch (error) {
                    message.error(error.message);
                  }
                }}
              >
                {item.isActive ? 'Desactivar' : 'Activar'}
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
        title="Unidades comerciales"
        description="Define las presentaciones utilizadas para comprar y vender productos."
        extra={
          <Can permission={permissions.productUnits.create}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModal('create')}
            >
              Nueva unidad
            </Button>
          </Can>
        }
      />
      <Card>
        <DataTable
          ariaLabel="Unidades comerciales"
          columns={columns}
          dataSource={query.data?.productUnits}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
        />
      </Card>
      <Modal
        title={
          modal === 'create'
            ? 'Nueva unidad comercial'
            : 'Editar unidad comercial'
        }
        open={Boolean(modal)}
        footer={null}
        onCancel={() => setModal(null)}
        destroyOnHidden
      >
        {modal ? (
          <ProductUnitForm
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
