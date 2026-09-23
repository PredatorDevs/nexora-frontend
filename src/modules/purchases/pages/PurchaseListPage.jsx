import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
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
import { PurchaseForm } from '../components/PurchaseForm.jsx';
import * as api from '../purchases.api.js';
const filters = {
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
  const [status, setStatus] = useState();
  const [editing, setEditing] = useState(null);
  const [detailsId, setDetailsId] = useState();
  const query = useQuery({
    queryKey: ['purchases', 'list', status],
    queryFn: () =>
      api.listPurchases({ ...filters, ...(status ? { status } : {}) }),
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
        <Select
          allowClear
          placeholder="Todos los estados"
          style={{ width: 220, marginBottom: 16 }}
          value={status}
          options={Object.entries(labels).map(([value, label]) => ({
            value,
            label,
          }))}
          onChange={setStatus}
        />
        <DataTable
          ariaLabel="Recepciones de compra"
          columns={columns}
          dataSource={query.data?.purchases}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
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
