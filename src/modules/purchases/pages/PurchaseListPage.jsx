import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { permissions } from '@/config/permissions.js';
import * as branchesApi from '@/modules/branches/branches.api.js';
import * as suppliersApi from '@/modules/suppliers/suppliers.api.js';
import * as warehousesApi from '@/modules/warehouses/warehouses.api.js';
import { PurchaseForm } from '../components/PurchaseForm.jsx';
import * as api from '../purchases.api.js';
const initialFilters = {
  page: 1,
  pageSize: 100,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};
const labels = {
  DRAFT: 'Borrador',
  RECEIVED: 'Recibida',
  VERIFIED: 'Verificada',
  CANCELLED: 'Cancelada',
  CLOSED: 'Cerrada',
};
const colors = {
  DRAFT: 'default',
  RECEIVED: 'processing',
  VERIFIED: 'success',
  CANCELLED: 'error',
  CLOSED: 'green',
};
const money = (value, currency) =>
  `${Number(value).toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
const date = (value, withTime = true) =>
  value
    ? dayjs(value).format(withTime ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY')
    : '—';
export function PurchaseListPage() {
  const { message, modal: dialog } = App.useApp();
  const client = useQueryClient();
  const [filters, setFilters] = useState(initialFilters);
  const [editing, setEditing] = useState(null);
  const [detailsId, setDetailsId] = useState();
  const query = useQuery({
    queryKey: ['purchases', 'list', filters],
    queryFn: () => api.listPurchases(filters),
  });
  const suppliers = useQuery({
    queryKey: ['suppliers', 'purchase-filter'],
    queryFn: () =>
      suppliersApi.listSuppliers({ ...initialFilters, sortBy: 'name' }),
    staleTime: 300_000,
  });
  const branches = useQuery({
    queryKey: ['branches', 'purchase-filter'],
    queryFn: () =>
      branchesApi.listBranches({ ...initialFilters, sortBy: 'name' }),
    staleTime: 300_000,
  });
  const warehouses = useQuery({
    queryKey: ['warehouses', 'purchase-filter', filters.branchId],
    queryFn: () =>
      warehousesApi.listWarehouses({
        ...initialFilters,
        sortBy: 'name',
        branchId: filters.branchId,
      }),
    enabled: Boolean(filters.branchId),
    staleTime: 300_000,
  });
  const details = useQuery({
    queryKey: ['purchases', 'detail', detailsId],
    queryFn: () => api.getPurchase(detailsId),
    enabled: Boolean(detailsId),
  });
  const save = useMutation({
    mutationFn: ({ item, data }) =>
      item === 'create'
        ? api.createPurchase(data)
        : api.updatePurchase(item, data),
  });
  const transition = useMutation({
    mutationFn: ({ item, action, reason }) =>
      api.transitionPurchase(item, action, reason),
  });
  const refresh = () => client.invalidateQueries({ queryKey: ['purchases'] });
  async function change(item, action, reason) {
    if (
      action === 'receive' &&
      (!item.supplierInvoiceNumber || !item.supplierInvoiceDate)
    ) {
      message.warning(
        'Completa el número y la fecha de la factura antes de confirmar la recepción.',
      );
      setEditing(item);
      return;
    }
    try {
      await transition.mutateAsync({ item, action, reason });
      await refresh();
      if (detailsId === item.id) details.refetch();
      message.success('Recepción actualizada.');
    } catch (error) {
      message.error(error.message);
    }
  }
  function cancel(item) {
    let reason = '';
    dialog.confirm({
      title: 'Cancelar borrador de recepción',
      content: (
        <Input.TextArea
          autoFocus
          rows={3}
          placeholder="Motivo obligatorio"
          onChange={(event) => {
            reason = event.target.value;
          }}
        />
      ),
      okText: 'Cancelar recepción',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!reason.trim()) {
          message.warning('Ingresa un motivo.');
          throw new Error('reason required');
        }
        await change(item, 'cancel', reason.trim());
      },
    });
  }
  const columns = [
    { title: 'Código', dataIndex: 'code' },
    { title: 'Orden', render: (_, x) => x.purchaseOrder.code },
    { title: 'Proveedor', render: (_, x) => x.supplier.name },
    { title: 'Almacén', render: (_, x) => x.warehouse.name },
    { title: 'Recepción', render: (_, x) => date(x.purchaseDate, false) },
    { title: 'Factura', render: (_, x) => x.supplierInvoiceNumber || '—' },
    { title: 'Total', render: (_, x) => money(x.total, x.currencyCode) },
    {
      title: 'Estado',
      render: (_, x) => <Tag color={colors[x.status]}>{labels[x.status]}</Tag>,
    },
    {
      title: 'Acciones',
      render: (_, x) => (
        <Space wrap>
          <Button icon={<EyeOutlined />} onClick={() => setDetailsId(x.id)} />
          {x.status === 'DRAFT' ? (
            <Can permission={permissions.purchases.update}>
              <Button icon={<EditOutlined />} onClick={() => setEditing(x)} />
            </Can>
          ) : null}
          {x.status === 'DRAFT' ? (
            <Can permission={permissions.purchases.receive}>
              <Popconfirm
                title="¿Confirmar la recepción?"
                description="Después de recibir no podrá editarse."
                onConfirm={() => change(x, 'receive')}
              >
                <Button type="primary">Recibir</Button>
              </Popconfirm>
            </Can>
          ) : null}
          {x.status === 'RECEIVED' ? (
            <Can permission={permissions.purchases.verify}>
              <Popconfirm
                title="¿Verificar esta compra?"
                onConfirm={() => change(x, 'verify')}
              >
                <Button>Verificar</Button>
              </Popconfirm>
            </Can>
          ) : null}
          {x.status === 'VERIFIED' ? (
            <Can permission={permissions.purchases.close}>
              <Popconfirm
                title="¿Cerrar esta compra?"
                onConfirm={() => change(x, 'close')}
              >
                <Button> cerrar </Button>
              </Popconfirm>
            </Can>
          ) : null}
          {x.status === 'DRAFT' ? (
            <Can permission={permissions.purchases.cancel}>
              <Button danger onClick={() => cancel(x)}>
                Cancelar
              </Button>
            </Can>
          ) : null}
        </Space>
      ),
    },
  ];
  const value = details.data;
  return (
    <>
      <PageHeader
        title="Recepciones de compra"
        description="Registra entregas parciales contra órdenes autorizadas y conserva su trazabilidad."
        extra={
          <Can permission={permissions.purchases.create}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setEditing('create')}
            >
              Nueva recepción
            </Button>
          </Can>
        }
      />
      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search
            allowClear
            placeholder="Código, orden, proveedor o factura"
            style={{ width: 330 }}
            onSearch={(search) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                search: search.trim() || undefined,
              }))
            }
          />
          <DatePicker.RangePicker
            placeholder={['Desde', 'Hasta']}
            onChange={(range) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                dateFrom: range?.[0]?.startOf('day').toISOString(),
                dateTo: range?.[1]?.endOf('day').toISOString(),
              }))
            }
          />
          <Select
            allowClear
            placeholder="Todos los estados"
            style={{ width: 220 }}
            options={Object.entries(labels).map(([value, label]) => ({
              value,
              label,
            }))}
            onChange={(status) =>
              setFilters((current) => ({ ...current, page: 1, status }))
            }
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Todos los proveedores"
            style={{ width: 250 }}
            loading={suppliers.isLoading}
            options={suppliers.data?.suppliers.map((item) => ({
              value: item.id,
              label: `${item.code} · ${item.name}`,
            }))}
            onChange={(supplierId) =>
              setFilters((current) => ({ ...current, page: 1, supplierId }))
            }
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Todas las sucursales"
            style={{ width: 230 }}
            loading={branches.isLoading}
            options={branches.data?.branches.map((item) => ({
              value: item.id,
              label: `${item.code} · ${item.name}`,
            }))}
            onChange={(branchId) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                branchId,
                warehouseId: undefined,
              }))
            }
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            disabled={!filters.branchId}
            placeholder="Todos los almacenes"
            style={{ width: 230 }}
            loading={warehouses.isLoading}
            options={warehouses.data?.warehouses.map((item) => ({
              value: item.id,
              label: `${item.code} · ${item.name}`,
            }))}
            onChange={(warehouseId) =>
              setFilters((current) => ({ ...current, page: 1, warehouseId }))
            }
          />
        </Space>
        <DataTable
          ariaLabel="Recepciones de compra"
          columns={columns}
          dataSource={query.data?.purchases}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
          onChange={(next) =>
            setFilters((current) => ({
              ...current,
              ...Object.fromEntries(
                Object.entries(next).filter(
                  ([key, value]) => key !== 'filters' && value !== undefined,
                ),
              ),
            }))
          }
        />
      </Card>
      <Modal
        title={editing === 'create' ? 'Nueva recepción' : 'Editar recepción'}
        open={Boolean(editing)}
        footer={null}
        width={1150}
        onCancel={() => setEditing(null)}
        destroyOnHidden
      >
        <PurchaseForm
          initialValues={editing === 'create' ? null : editing}
          isSubmitting={save.isPending}
          onCancel={() => setEditing(null)}
          onSubmit={async (data) => {
            try {
              await save.mutateAsync({ item: editing, data });
              await refresh();
              setEditing(null);
              message.success('Borrador guardado.');
            } catch (error) {
              message.error(error.message);
            }
          }}
        />
      </Modal>
      <Modal
        title={value ? `Recepción ${value.code}` : 'Detalle'}
        open={Boolean(detailsId)}
        footer={null}
        width={1150}
        onCancel={() => setDetailsId(null)}
        loading={details.isLoading}
        destroyOnHidden
      >
        {value ? (
          <>
            <Descriptions
              bordered
              size="small"
              column={2}
              items={[
                { key: 'uuid', label: 'UUID', children: value.uuid },
                {
                  key: 'status',
                  label: 'Estado',
                  children: (
                    <Tag color={colors[value.status]}>
                      {labels[value.status]}
                    </Tag>
                  ),
                },
                {
                  key: 'order',
                  label: 'Orden de compra',
                  children: value.purchaseOrder.code,
                },
                {
                  key: 'supplier',
                  label: 'Proveedor',
                  children: `${value.supplier.code} · ${value.supplier.name}`,
                },
                {
                  key: 'branch',
                  label: 'Sucursal',
                  children: `${value.branch.code} · ${value.branch.name}`,
                },
                {
                  key: 'warehouse',
                  label: 'Almacén',
                  children: `${value.warehouse.code} · ${value.warehouse.name}`,
                },
                {
                  key: 'purchaseDate',
                  label: 'Fecha de recepción',
                  children: date(value.purchaseDate),
                },
                {
                  key: 'responsible',
                  label: 'Responsable',
                  children: `${value.receivedBy.displayName} · ${value.receivedBy.email}`,
                },
                {
                  key: 'invoice',
                  label: 'Factura',
                  children: value.supplierInvoiceNumber || '—',
                },
                {
                  key: 'invoiceDate',
                  label: 'Fecha de factura',
                  children: date(value.supplierInvoiceDate, false),
                },
                {
                  key: 'currency',
                  label: 'Moneda / Tipo de cambio',
                  children: `${value.currencyCode} · ${value.exchangeRate}`,
                },
                {
                  key: 'totals',
                  label: 'Subtotal / Descuento / Impuesto / Total',
                  span: 2,
                  children: `${money(value.subtotal, value.currencyCode)} · ${money(value.discount, value.currencyCode)} · ${money(value.tax, value.currencyCode)} · ${money(value.total, value.currencyCode)}`,
                },
                {
                  key: 'receivedAt',
                  label: 'Confirmada',
                  children: date(value.receivedAt),
                },
                {
                  key: 'verifiedAt',
                  label: 'Verificada',
                  children: value.verifiedAt
                    ? `${date(value.verifiedAt)} · ${value.verifiedBy?.displayName ?? '—'}`
                    : '—',
                },
                {
                  key: 'closedAt',
                  label: 'Cerrada',
                  children: date(value.closedAt),
                },
                {
                  key: 'cancelledAt',
                  label: 'Cancelada',
                  children: value.cancelledAt
                    ? `${date(value.cancelledAt)} · ${value.cancelledBy?.displayName ?? '—'}`
                    : '—',
                },
                {
                  key: 'notes',
                  label: 'Observaciones',
                  span: 2,
                  children: value.notes || '—',
                },
                {
                  key: 'cancellationReason',
                  label: 'Motivo de cancelación',
                  span: 2,
                  children: value.cancellationReason || '—',
                },
                {
                  key: 'createdAt',
                  label: 'Creada',
                  children: date(value.createdAt),
                },
                {
                  key: 'updatedAt',
                  label: 'Última actualización',
                  children: date(value.updatedAt),
                },
              ]}
            />
            <Table
              style={{ marginTop: 16 }}
              rowKey="id"
              pagination={false}
              dataSource={value.details}
              scroll={{ x: 1100 }}
              columns={[
                { title: '#', dataIndex: 'lineNumber' },
                {
                  title: 'Producto',
                  render: (_, x) =>
                    `${x.product.internalCode} · ${x.product.name}`,
                },
                { title: 'Unidad', render: (_, x) => x.productUnit.name },
                { title: 'Ordenado', dataIndex: 'quantityOrdered' },
                { title: 'Recibido', dataIndex: 'quantityReceived' },
                {
                  title: 'Precio',
                  render: (_, x) => money(x.unitPrice, value.currencyCode),
                },
                {
                  title: 'Descuento',
                  render: (_, x) => money(x.discountAmount, value.currencyCode),
                },
                {
                  title: 'Impuesto',
                  render: (_, x) => money(x.taxAmount, value.currencyCode),
                },
                {
                  title: 'Total',
                  render: (_, x) => money(x.total, value.currencyCode),
                },
                { title: 'Notas', render: (_, x) => x.notes || '—' },
              ]}
            />
          </>
        ) : null}
      </Modal>
    </>
  );
}
