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
import { PurchaseQuotationForm } from '../components/PurchaseQuotationForm.jsx';
import * as api from '../purchase-quotations.api.js';
const filters = {
  page: 1,
  pageSize: 100,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};
const labels = {
  DRAFT: 'Borrador',
  RECEIVED: 'Recibida',
  UNDER_REVIEW: 'En evaluación',
  SELECTED: 'Seleccionada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada',
};
const colors = {
  DRAFT: 'default',
  RECEIVED: 'blue',
  UNDER_REVIEW: 'processing',
  SELECTED: 'success',
  REJECTED: 'error',
  EXPIRED: 'warning',
  CANCELLED: 'default',
};
const money = (v, c) =>
  `${Number(v).toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;
export function PurchaseQuotationListPage() {
  const { message, modal: dialog } = App.useApp(),
    client = useQueryClient();
  const [editing, setEditing] = useState(null),
    [detailsId, setDetailsId] = useState(null),
    [status, setStatus] = useState();
  const query = useQuery({
    queryKey: ['purchase-quotations', 'list', status],
    queryFn: () =>
      api.listPurchaseQuotations({ ...filters, ...(status ? { status } : {}) }),
  });
  const details = useQuery({
    queryKey: ['purchase-quotations', 'detail', detailsId],
    queryFn: () => api.getPurchaseQuotation(detailsId),
    enabled: Boolean(detailsId),
  });
  const save = useMutation({
    mutationFn: ({ item, data }) =>
      item === 'create'
        ? api.createPurchaseQuotation(data)
        : api.updatePurchaseQuotation(item.id, {
            ...data,
            expectedUpdatedAt: item.updatedAt,
          }),
  });
  const transition = useMutation({
    mutationFn: ({ item, action, reason }) =>
      api.transitionPurchaseQuotation(item, action, reason),
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: ['purchase-quotations'] });
  async function change(item, action, reason) {
    try {
      await transition.mutateAsync({ item, action, reason });
      await refresh();
      if (detailsId === item.id) await details.refetch();
      message.success('Cotización actualizada.');
    } catch (error) {
      message.error(error.message);
    }
  }
  function cancel(item) {
    let reason = '';
    dialog.confirm({
      title: 'Cancelar cotización',
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Motivo obligatorio"
          onChange={(e) => {
            reason = e.target.value;
          }}
        />
      ),
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!reason.trim()) {
          message.warning('Ingresa un motivo.');
          throw new Error('required');
        }
        await change(item, 'cancel', reason.trim());
      },
    });
  }
  const columns = [
    { title: 'Código', dataIndex: 'code' },
    { title: 'Proveedor', render: (_, x) => x.supplier.name },
    {
      title: 'Fecha',
      render: (_, x) => dayjs(x.quotationDate).format('DD/MM/YYYY'),
    },
    {
      title: 'Vigencia',
      render: (_, x) => dayjs(x.validUntil).format('DD/MM/YYYY'),
    },
    { title: 'Total', render: (_, x) => money(x.total, x.currencyCode) },
    {
      title: 'Estado',
      render: (_, x) => <Tag color={colors[x.status]}>{labels[x.status]}</Tag>,
    },
    {
      title: 'Acciones',
      render: (_, item) => (
        <Space wrap>
          <Button
            icon={<EyeOutlined />}
            onClick={() => setDetailsId(item.id)}
          />
          {item.status === 'DRAFT' ? (
            <Can permission={permissions.purchaseQuotations.update}>
              <Button
                icon={<EditOutlined />}
                onClick={() => setEditing(item)}
              />
            </Can>
          ) : null}
          {item.status === 'DRAFT' ? (
            <Can permission={permissions.purchaseQuotations.receive}>
              <Popconfirm
                title="¿Marcar como recibida?"
                onConfirm={() => change(item, 'receive')}
              >
                <Button>Recibir</Button>
              </Popconfirm>
            </Can>
          ) : null}
          {item.status === 'RECEIVED' ? (
            <Can permission={permissions.purchaseQuotations.review}>
              <Popconfirm
                title="¿Enviar a evaluación? Después no podrá editarse."
                onConfirm={() => change(item, 'review')}
              >
                <Button type="primary">Evaluar</Button>
              </Popconfirm>
            </Can>
          ) : null}
          {['DRAFT', 'RECEIVED', 'UNDER_REVIEW'].includes(item.status) ? (
            <Can permission={permissions.purchaseQuotations.cancel}>
              <Button danger onClick={() => cancel(item)}>
                Cancelar
              </Button>
            </Can>
          ) : null}
          {['RECEIVED', 'UNDER_REVIEW'].includes(item.status) &&
          dayjs(item.validUntil).isBefore(dayjs()) ? (
            <Can permission={permissions.purchaseQuotations.expire}>
              <Button onClick={() => change(item, 'expire')}>Vencer</Button>
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
        title="Cotizaciones de compra"
        description="Registra las ofertas comerciales recibidas de proveedores."
        extra={
          <Can permission={permissions.purchaseQuotations.create}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setEditing('create')}
            >
              Nueva cotización
            </Button>
          </Can>
        }
      />
      <Card>
        <Select
          allowClear
          placeholder="Todos los estados"
          style={{ width: 220, marginBottom: 16 }}
          options={Object.entries(labels).map(([value, label]) => ({
            value,
            label,
          }))}
          value={status}
          onChange={setStatus}
        />
        <DataTable
          ariaLabel="Cotizaciones de compra"
          columns={columns}
          dataSource={query.data?.purchaseQuotations}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
        />
      </Card>
      <Modal
        title={editing === 'create' ? 'Nueva cotización' : 'Editar cotización'}
        open={Boolean(editing)}
        footer={null}
        width={1200}
        onCancel={() => setEditing(null)}
        destroyOnHidden
      >
        {editing ? (
          <PurchaseQuotationForm
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
        ) : null}
      </Modal>
      <Modal
        title={value ? `Cotización ${value.code}` : 'Detalle de cotización'}
        open={Boolean(detailsId)}
        footer={null}
        width={1100}
        onCancel={() => setDetailsId(null)}
        destroyOnHidden
        loading={details.isLoading}
      >
        {value ? (
          <>
            <Descriptions
              bordered
              size="small"
              column={2}
              items={[
                {
                  key: 'id',
                  label: 'ID / UUID',
                  children: `${value.id} · ${value.uuid}`,
                },
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
                  key: 'supplier',
                  label: 'Proveedor',
                  children: `${value.supplier.code} · ${value.supplier.name}`,
                },
                {
                  key: 'contact',
                  label: 'Contacto',
                  children: value.supplierContact?.fullName ?? '—',
                },
                {
                  key: 'external',
                  label: 'Número del proveedor',
                  children: value.supplierQuotationNumber ?? '—',
                },
                {
                  key: 'registered',
                  label: 'Registrada por',
                  children: value.registeredBy.displayName,
                },
                {
                  key: 'dates',
                  label: 'Fecha / Vigencia',
                  children: `${dayjs(value.quotationDate).format('DD/MM/YYYY')} · ${dayjs(value.validUntil).format('DD/MM/YYYY')}`,
                },
                {
                  key: 'currency',
                  label: 'Moneda / Cambio',
                  children: `${value.currencyCode} · ${value.exchangeRate}`,
                },
                {
                  key: 'terms',
                  label: 'Condiciones de pago',
                  span: 2,
                  children: value.paymentTerms ?? '—',
                },
                {
                  key: 'delivery',
                  label: 'Entrega general',
                  children:
                    value.deliveryDays == null
                      ? '—'
                      : `${value.deliveryDays} días`,
                },
                {
                  key: 'transitions',
                  label: 'Recibida / Evaluación',
                  children: `${value.receivedAt ? dayjs(value.receivedAt).format('DD/MM/YYYY HH:mm') : '—'} · ${value.underReviewAt ? dayjs(value.underReviewAt).format('DD/MM/YYYY HH:mm') : '—'}`,
                },
                {
                  key: 'totals',
                  label: 'Subtotal / Descuento / Impuesto / Total',
                  span: 2,
                  children: `${money(value.subtotal, value.currencyCode)} · -${money(value.discount, value.currencyCode)} · ${money(value.tax, value.currencyCode)} · ${money(value.total, value.currencyCode)}`,
                },
                {
                  key: 'notes',
                  label: 'Observaciones',
                  span: 2,
                  children: value.notes ?? '—',
                },
                {
                  key: 'cancel',
                  label: 'Cancelación',
                  span: 2,
                  children: value.cancellationReason ?? '—',
                },
                {
                  key: 'audit',
                  label: 'Creada / Actualizada',
                  span: 2,
                  children: `${dayjs(value.createdAt).format('DD/MM/YYYY HH:mm')} · ${dayjs(value.updatedAt).format('DD/MM/YYYY HH:mm')}`,
                },
              ]}
            />
            <Table
              rowKey="id"
              pagination={false}
              scroll={{ x: 1000 }}
              style={{ marginTop: 16 }}
              dataSource={value.details}
              columns={[
                { title: '#', dataIndex: 'lineNumber' },
                {
                  title: 'Producto',
                  render: (_, x) =>
                    `${x.product.internalCode} · ${x.product.name}`,
                },
                { title: 'Cantidad', dataIndex: 'quantity' },
                {
                  title: 'Unidad',
                  render: (_, x) =>
                    `${x.productUnit.name} (${x.productUnit.measurementUnit.symbol})`,
                },
                {
                  title: 'Precio',
                  render: (_, x) => money(x.unitPrice, value.currencyCode),
                },
                {
                  title: 'Descuento',
                  render: (_, x) =>
                    `${x.discountRate}% · ${money(x.discountAmount, value.currencyCode)}`,
                },
                {
                  title: 'Impuesto',
                  render: (_, x) =>
                    `${x.taxRate}% · ${money(x.taxAmount, value.currencyCode)}`,
                },
                {
                  title: 'Disponible',
                  render: (_, x) => x.availableQuantity ?? '—',
                },
                {
                  title: 'Entrega',
                  render: (_, x) =>
                    x.deliveryDays == null ? '—' : `${x.deliveryDays} días`,
                },
                {
                  title: 'Total',
                  render: (_, x) => money(x.total, value.currencyCode),
                },
              ]}
            />
          </>
        ) : null}
      </Modal>
    </>
  );
}
