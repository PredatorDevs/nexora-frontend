import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Descriptions, Modal, Space, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import { queryKeys } from '@/api/query-keys.js';
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
  const [detailsId, setDetailsId] = useState(null);
  const query = useQuery({
    queryKey: queryKeys.productUnits.list(filters),
    queryFn: () => api.listProductUnits(filters),
  });
  const detailsQuery = useQuery({
    queryKey: queryKeys.productUnits.detail(detailsId),
    queryFn: () => api.getProductUnit(detailsId),
    enabled: Boolean(detailsId),
  });
  const details = detailsQuery.data;
  const create = useMutation({ mutationFn: api.createProductUnit }),
    update = useMutation({
      mutationFn: ({ id, data }) => api.updateProductUnit(id, data),
    }),
    status = useMutation({
      mutationFn: ({ item, next }) => api.changeProductUnitStatus(item, next),
    });
  const refresh = useCallback(
    () => client.invalidateQueries({ queryKey: queryKeys.productUnits.all }),
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
            <Can permission={permissions.productUnits.read}>
              <Button
                icon={<EyeOutlined />}
                aria-label={`Ver detalle de ${item.name}`}
                onClick={() => setDetailsId(item.id)}
              />
            </Can>
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
      <Modal
        title={details?.name ?? 'Detalle de la unidad comercial'}
        open={Boolean(detailsId)}
        footer={null}
        width={800}
        onCancel={() => setDetailsId(null)}
        destroyOnHidden
      >
        {detailsQuery.isLoading ? (
          <div style={{ display: 'grid', minHeight: 160, placeItems: 'center' }}>
            <Spin />
          </div>
        ) : detailsQuery.isError ? (
          <Alert
            showIcon
            type="error"
            message="No fue posible cargar la unidad comercial."
            description={detailsQuery.error.message}
            action={<Button onClick={() => detailsQuery.refetch()}>Reintentar</Button>}
          />
        ) : details ? (
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="ID">{details.id}</Descriptions.Item>
            <Descriptions.Item label="Código">{details.code}</Descriptions.Item>
            <Descriptions.Item label="Uso">
              <Tag color={details.type === 'PURCHASE' ? 'blue' : 'green'}>
                {details.type === 'PURCHASE' ? 'Compra' : 'Venta'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              <StatusBadge status={details.isActive ? 'ACTIVE' : 'INACTIVE'} />
            </Descriptions.Item>
            <Descriptions.Item label="Unidad de medida" span={2}>
              {details.measurementUnit.name}
            </Descriptions.Item>
            <Descriptions.Item label="Nombre plural">
              {details.measurementUnit.pluralName ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Símbolo">
              {details.measurementUnit.symbol ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Código MH">
              {details.measurementUnit.mhCode ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Estado de la unidad base">
              <StatusBadge
                status={details.measurementUnit.isActive ? 'ACTIVE' : 'INACTIVE'}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Descripción" span={2}>
              {details.description ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Creada">
              {dayjs(details.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Última actualización">
              {dayjs(details.updatedAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </>
  );
}
