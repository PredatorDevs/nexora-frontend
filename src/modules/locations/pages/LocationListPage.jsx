import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Modal,
  Select,
  Space,
  Spin,
  Tabs,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import { queryKeys } from '@/api/query-keys.js';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import * as branchesApi from '@/modules/branches/branches.api.js';
import { LocationForm } from '@/modules/locations/components/LocationForm.jsx';
import { LocationBulkForm } from '@/modules/locations/components/LocationBulkForm.jsx';
import * as api from '@/modules/locations/locations.api.js';
import { formatLocationReference } from '@/modules/locations/location-reference.js';
import * as warehousesApi from '@/modules/warehouses/warehouses.api.js';

const baseFilters = {
  page: 1,
  pageSize: 100,
  sortBy: 'code',
  sortOrder: 'asc',
};
const capacityUnitLabels = {
  UNITS: 'Unidades',
  KG: 'Kilogramos',
  M3: 'Metros cúbicos',
  PALLETS: 'Tarimas',
};
export function LocationListPage() {
  const { message, modal: dialog } = App.useApp();
  const client = useQueryClient();
  const [modal, setModal] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [branchId, setBranchId] = useState();
  const [warehouseId, setWarehouseId] = useState();
  const filters = useMemo(
    () => ({
      ...baseFilters,
      ...(branchId ? { branchId } : {}),
      ...(warehouseId ? { warehouseId } : {}),
    }),
    [branchId, warehouseId],
  );
  const branches = useQuery({
    queryKey: ['branches', 'location-filter'],
    queryFn: () => branchesApi.listBranches({ ...baseFilters, sortBy: 'name' }),
    staleTime: 300_000,
  });
  const warehouses = useQuery({
    queryKey: ['warehouses', 'location-filter', branchId],
    queryFn: () =>
      warehousesApi.listWarehouses({
        ...baseFilters,
        sortBy: 'name',
        branchId,
      }),
    enabled: Boolean(branchId),
    staleTime: 300_000,
  });
  const query = useQuery({
    queryKey: queryKeys.locations.list(filters),
    queryFn: () => api.listLocations(filters),
  });
  const detailsQuery = useQuery({
    queryKey: queryKeys.locations.detail(detailsId),
    queryFn: () => api.getLocation(detailsId),
    enabled: Boolean(detailsId),
  });
  const details = detailsQuery.data;
  const create = useMutation({ mutationFn: api.createLocation });
  const createBulk = useMutation({ mutationFn: api.createLocationsBulk });
  const update = useMutation({
    mutationFn: ({ id, data }) => api.updateLocation(id, data),
  });
  const status = useMutation({
    mutationFn: ({ location, next }) =>
      api.changeLocationStatus(location.id, next, location.updatedAt),
  });
  const refresh = useCallback(
    () => client.invalidateQueries({ queryKey: queryKeys.locations.all }),
    [client],
  );
  async function submit(data) {
    try {
      if (modal === 'create') {
        await create.mutateAsync(data);
        message.success('Ubicación creada.');
      } else {
        await update.mutateAsync({
          id: modal.id,
          data: { ...data, expectedUpdatedAt: modal.updatedAt },
        });
        message.success('Ubicación actualizada.');
      }
      await refresh();
      setModal(null);
    } catch (error) {
      message.error(error.message);
    }
  }
  async function submitBulk(data) {
    const total = data.levelCount * data.positionsPerLevel;
    if (total >= 50) {
      const confirmed = await new Promise((resolve) =>
        dialog.confirm({
          title: `Crear ${total} ubicaciones`,
          content:
            'La operación será atómica: si alguna coordenada ya existe, no se creará ninguna ubicación.',
          okText: 'Crear lote',
          cancelText: 'Revisar',
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        }),
      );
      if (!confirmed) return;
    }
    try {
      const result = await createBulk.mutateAsync(data);
      await refresh();
      setModal(null);
      message.success(`${result.createdCount} ubicaciones creadas.`);
    } catch (error) {
      message.error(error.message);
    }
  }
  const columns = useMemo(
    () => [
      { title: 'Código', dataIndex: 'code' },
      { title: 'Almacén', render: (_, item) => item.warehouse?.name },
      {
        title: 'Referencia física',
        render: (_, item) => formatLocationReference(item),
      },
      {
        title: 'Capacidad',
        render: (_, item) =>
          item.capacity == null ? '—' : `${item.capacity} ${item.capacityUnit}`,
      },
      {
        title: 'Estado',
        dataIndex: 'isActive',
        render: (value) => (
          <StatusBadge status={value ? 'ACTIVE' : 'INACTIVE'} />
        ),
      },
      {
        title: 'Acciones',
        render: (_, location) => (
          <Space>
            <Can permission={permissions.locations.read}>
              <Button
                icon={<EyeOutlined />}
                aria-label={`Ver detalle de ${location.code}`}
                onClick={() => setDetailsId(location.id)}
              />
            </Can>
            <Can permission={permissions.locations.update}>
              <Button
                icon={<EditOutlined />}
                aria-label={`Editar ${location.code}`}
                onClick={() => setModal(location)}
              />
            </Can>
            <Can permission={permissions.locations.changeStatus}>
              <Button
                loading={status.isPending}
                onClick={async () => {
                  try {
                    await status.mutateAsync({
                      location,
                      next: !location.isActive,
                    });
                    await refresh();
                    message.success('Estado actualizado.');
                  } catch (error) {
                    message.error(error.message);
                  }
                }}
              >
                {location.isActive ? 'Desactivar' : 'Activar'}
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
        title="Ubicaciones"
        description="Administra pasillos, estantes, niveles y posiciones de los almacenes."
        extra={
          <Can permission={permissions.locations.create}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModal('create')}
            >
              Nueva ubicación
            </Button>
          </Can>
        }
      />
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Todas las sucursales"
            value={branchId}
            loading={branches.isLoading}
            style={{ width: 260 }}
            options={branches.data?.branches.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={(value) => {
              setBranchId(value);
              setWarehouseId(undefined);
            }}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Todos los almacenes"
            disabled={!branchId}
            value={warehouseId}
            loading={warehouses.isLoading}
            style={{ width: 260 }}
            options={warehouses.data?.warehouses.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            onChange={setWarehouseId}
          />
        </Space>
        <DataTable
          ariaLabel="Ubicaciones"
          columns={columns}
          dataSource={query.data?.locations}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
        />
      </Card>
      <Modal
        title={modal === 'create' ? 'Nueva ubicación' : 'Editar ubicación'}
        open={Boolean(modal)}
        footer={null}
        width={760}
        onCancel={() => setModal(null)}
        destroyOnHidden
      >
        {modal === 'create' ? (
          <Tabs
            destroyOnHidden
            items={[
              {
                key: 'individual',
                label: 'Individual',
                children: (
                  <LocationForm
                    key="create-individual"
                    initialValues={null}
                    isSubmitting={create.isPending}
                    onCancel={() => setModal(null)}
                    onSubmit={submit}
                  />
                ),
              },
              {
                key: 'bulk',
                label: 'Creación múltiple',
                children: (
                  <LocationBulkForm
                    key="create-bulk"
                    isSubmitting={createBulk.isPending}
                    onCancel={() => setModal(null)}
                    onSubmit={submitBulk}
                  />
                ),
              },
            ]}
          />
        ) : modal ? (
          <LocationForm
            key={modal.id}
            initialValues={modal}
            isSubmitting={update.isPending}
            onCancel={() => setModal(null)}
            onSubmit={submit}
          />
        ) : null}
      </Modal>
      <Modal
        title={details ? `Ubicación ${details.code}` : 'Detalle de la ubicación'}
        open={Boolean(detailsId)}
        footer={null}
        width={860}
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
            message="No fue posible cargar la ubicación."
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
            <Descriptions.Item label="Separador">
              {details.warehouse.locationSeparator}
            </Descriptions.Item>
            <Descriptions.Item label="Sucursal" span={2}>
              {details.warehouse.branch.code} — {details.warehouse.branch.name}
            </Descriptions.Item>
            <Descriptions.Item label="Almacén" span={2}>
              {details.warehouse.code} — {details.warehouse.name}
            </Descriptions.Item>
            <Descriptions.Item label="Referencia física" span={2}>
              {formatLocationReference(details)}
            </Descriptions.Item>
            <Descriptions.Item label="Pasillo">{details.aisle}</Descriptions.Item>
            <Descriptions.Item label="Estante">{details.rack}</Descriptions.Item>
            <Descriptions.Item label="Nivel">{details.level}</Descriptions.Item>
            <Descriptions.Item label="Posición">{details.position}</Descriptions.Item>
            <Descriptions.Item label="Capacidad">
              {details.capacity ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Unidad de capacidad">
              {capacityUnitLabels[details.capacityUnit] ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Observaciones" span={2}>
              {details.notes ?? '—'}
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
