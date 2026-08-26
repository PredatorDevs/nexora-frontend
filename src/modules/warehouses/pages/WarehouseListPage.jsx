import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Descriptions, Modal, Select, Space, Spin } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import { queryKeys } from '@/api/query-keys.js';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import * as branchesApi from '@/modules/branches/branches.api.js';
import { WarehouseForm } from '@/modules/warehouses/components/WarehouseForm.jsx';
import * as api from '@/modules/warehouses/warehouses.api.js';

const baseFilters = { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' };
export function WarehouseListPage() {
  const { message } = App.useApp();
  const client = useQueryClient();
  const [modal, setModal] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [branchId, setBranchId] = useState();
  const filters = useMemo(() => ({ ...baseFilters, ...(branchId ? { branchId } : {}) }), [branchId]);
  const branches = useQuery({
    queryKey: ['branches', 'warehouse-filter'],
    queryFn: () => branchesApi.listBranches(baseFilters),
    staleTime: 300_000,
  });
  const query = useQuery({
    queryKey: queryKeys.warehouses.list(filters),
    queryFn: () => api.listWarehouses(filters),
  });
  const detailsQuery = useQuery({
    queryKey: queryKeys.warehouses.detail(detailsId),
    queryFn: () => api.getWarehouse(detailsId),
    enabled: Boolean(detailsId),
  });
  const details = detailsQuery.data;
  const create = useMutation({ mutationFn: api.createWarehouse });
  const update = useMutation({ mutationFn: ({ id, data }) => api.updateWarehouse(id, data) });
  const status = useMutation({
    mutationFn: ({ warehouse, next }) => api.changeWarehouseStatus(warehouse.id, next, warehouse.updatedAt),
  });
  const refresh = useCallback(
    () => client.invalidateQueries({ queryKey: queryKeys.warehouses.all }),
    [client],
  );
  async function submit(data) {
    try {
      if (modal === 'create') {
        await create.mutateAsync(data);
        message.success('Almacén creado.');
      } else {
        await update.mutateAsync({ id: modal.id, data: { ...data, expectedUpdatedAt: modal.updatedAt } });
        message.success('Almacén actualizado.');
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
    { title: 'Sucursal', render: (_, item) => item.branch?.name },
    { title: 'Categoría', render: (_, item) => item.warehouseCategory?.name },
    { title: 'Separador', dataIndex: 'locationSeparator', align: 'center' },
    { title: 'Estado', dataIndex: 'isActive', render: (value) => <StatusBadge status={value ? 'ACTIVE' : 'INACTIVE'} /> },
    {
      title: 'Acciones',
      render: (_, warehouse) => (
        <Space>
          <Can permission={permissions.warehouses.read}>
            <Button
              icon={<EyeOutlined />}
              aria-label={`Ver detalle de ${warehouse.name}`}
              onClick={() => setDetailsId(warehouse.id)}
            />
          </Can>
          <Can permission={permissions.warehouses.update}>
            <Button icon={<EditOutlined />} aria-label={`Editar ${warehouse.name}`} onClick={() => setModal(warehouse)} />
          </Can>
          <Can permission={permissions.warehouses.changeStatus}>
            <Button loading={status.isPending} onClick={async () => {
              try {
                await status.mutateAsync({ warehouse, next: !warehouse.isActive });
                await refresh();
                message.success('Estado actualizado.');
              } catch (error) {
                message.error(error.message);
              }
            }}>
              {warehouse.isActive ? 'Desactivar' : 'Activar'}
            </Button>
          </Can>
        </Space>
      ),
    },
  ], [message, refresh, status]);
  return (
    <>
      <PageHeader
        title="Almacenes"
        description="Administra los espacios de almacenamiento de las sucursales."
        extra={<Can permission={permissions.warehouses.create}><Button type="primary" icon={<PlusOutlined />} onClick={() => setModal('create')}>Nuevo almacén</Button></Can>}
      />
      <Card>
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder="Todas las sucursales"
          value={branchId}
          onChange={setBranchId}
          loading={branches.isLoading}
          options={branches.data?.branches.map((item) => ({ value: item.id, label: item.name }))}
          style={{ width: 280, marginBottom: 16 }}
        />
        <DataTable ariaLabel="Almacenes" columns={columns} dataSource={query.data?.warehouses} isLoading={query.isLoading} error={query.error} onRetry={query.refetch} pagination={query.data?.pagination ?? { ...filters, total: 0 }} />
      </Card>
      <Modal title={modal === 'create' ? 'Nuevo almacén' : 'Editar almacén'} open={Boolean(modal)} footer={null} onCancel={() => setModal(null)} destroyOnHidden>
        {modal ? <WarehouseForm key={modal === 'create' ? 'create' : modal.id} initialValues={modal === 'create' ? null : modal} isSubmitting={create.isPending || update.isPending} onCancel={() => setModal(null)} onSubmit={submit} /> : null}
      </Modal>
      <Modal
        title={details?.name ?? 'Detalle del almacén'}
        open={Boolean(detailsId)}
        footer={null}
        width={820}
        onCancel={() => setDetailsId(null)}
        destroyOnHidden
      >
        {detailsQuery.isLoading ? (
          <div style={{ display: 'grid', minHeight: 180, placeItems: 'center' }}>
            <Spin />
          </div>
        ) : detailsQuery.isError ? (
          <Alert
            showIcon
            type="error"
            message="No fue posible cargar el almacén."
            description={detailsQuery.error.message}
            action={<Button onClick={() => detailsQuery.refetch()}>Reintentar</Button>}
          />
        ) : details ? (
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="ID">{details.id}</Descriptions.Item>
            <Descriptions.Item label="Código">{details.code}</Descriptions.Item>
            <Descriptions.Item label="Estado">
              <StatusBadge status={details.isActive ? 'ACTIVE' : 'INACTIVE'} />
            </Descriptions.Item>
            <Descriptions.Item label="Separador de ubicaciones">
              {details.locationSeparator}
            </Descriptions.Item>
            <Descriptions.Item label="Sucursal" span={2}>
              {details.branch.code} — {details.branch.name}
            </Descriptions.Item>
            <Descriptions.Item label="Categoría de almacén" span={2}>
              {details.warehouseCategory.code} — {details.warehouseCategory.name}
            </Descriptions.Item>
            <Descriptions.Item label="Descripción" span={2}>
              {details.description ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Creado">
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
