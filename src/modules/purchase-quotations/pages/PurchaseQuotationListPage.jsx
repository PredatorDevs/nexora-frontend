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
import { PurchaseQuotationRequestLinksForm } from '../components/PurchaseQuotationRequestLinksForm.jsx';
import { PurchaseQuotationExpensesForm } from '../components/PurchaseQuotationExpensesForm.jsx';
import { listPurchaseRequests } from '@/modules/purchase-requests/purchase-requests.api.js';
import { listExpenseTypes } from '@/modules/expense-types/expense-types.api.js';
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
    [linking, setLinking] = useState(null),
    [expensing, setExpensing] = useState(null),
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
  const eligibleRequests = useQuery({
    queryKey: ['purchase-requests', 'eligible-for-quotation'],
    queryFn: async () => {
      const query = {
        page: 1,
        pageSize: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      const [approved, linked] = await Promise.all([
        listPurchaseRequests({ ...query, status: 'APPROVED' }),
        listPurchaseRequests({ ...query, status: 'IN_QUOTATION' }),
      ]);
      return [...approved.purchaseRequests, ...linked.purchaseRequests];
    },
    enabled: Boolean(linking),
  });
  const expenseTypes = useQuery({
    queryKey: ['expense-types', 'active-for-quotation'],
    queryFn: () =>
      listExpenseTypes({
        page: 1,
        pageSize: 100,
        sortBy: 'name',
        sortOrder: 'asc',
        isActive: true,
      }),
    enabled: Boolean(expensing),
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
  const saveLinks = useMutation({
    mutationFn: ({ item, links }) =>
      api.replacePurchaseQuotationRequestLinks(item, links),
  });
  const saveExpenses = useMutation({
    mutationFn: ({ item, expenses }) =>
      api.replacePurchaseQuotationExpenses(item, expenses),
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
    {
      title: 'Costo comparativo',
      render: (_, x) => money(x.grandTotal, x.currencyCode),
    },
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
          {item.status === 'DRAFT' && !item.requestLinks?.length ? (
            <Can permission={permissions.purchaseQuotations.update}>
              <Button
                icon={<EditOutlined />}
                onClick={() => setEditing(item)}
              />
            </Can>
          ) : null}
          {item.status === 'DRAFT' ? (
            <Can permission={permissions.purchaseQuotations.linkRequests}>
              <Button onClick={() => setLinking(item)}>Solicitudes</Button>
            </Can>
          ) : null}
          {['DRAFT', 'RECEIVED'].includes(item.status) ? (
            <Can permission={permissions.purchaseQuotations.manageExpenses}>
              <Button onClick={() => setExpensing(item)}>Gastos</Button>
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
                  key: 'comparativeTotal',
                  label: 'Gastos / Costo comparativo',
                  span: 2,
                  children: `${money(value.expenseTotal, value.currencyCode)} · ${money(value.grandTotal, value.currencyCode)}`,
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
            <Table
              rowKey="id"
              pagination={false}
              style={{ marginTop: 16 }}
              dataSource={value.requestLinks?.flatMap((link) =>
                link.details.map((item) => ({
                  ...item,
                  purchaseRequest: link.purchaseRequest,
                })),
              )}
              columns={[
                {
                  title: 'Solicitud vinculada',
                  render: (_, x) => x.purchaseRequest.code,
                },
                {
                  title: 'Producto solicitado',
                  render: (_, x) =>
                    `${x.requestDetail.product.internalCode} · ${x.requestDetail.product.name}`,
                },
                { title: 'Cantidad vinculada', dataIndex: 'quantity' },
              ]}
              locale={{ emptyText: 'Sin solicitudes vinculadas' }}
            />
            <Table
              rowKey="id"
              pagination={false}
              style={{ marginTop: 16 }}
              dataSource={value.expenses}
              columns={[
                { title: '#', dataIndex: 'lineNumber' },
                {
                  title: 'Tipo de gasto',
                  render: (_, x) =>
                    `${x.expenseType.code} · ${x.expenseType.name}`,
                },
                {
                  title: 'Descripción',
                  dataIndex: 'description',
                  render: (text) => text || '—',
                },
                {
                  title: 'Importe',
                  render: (_, x) => money(x.amount, value.currencyCode),
                },
              ]}
              locale={{ emptyText: 'Sin gastos adicionales' }}
            />
          </>
        ) : null}
      </Modal>
      <Modal
        title={expensing ? `Gastos · ${expensing.code}` : 'Gastos'}
        open={Boolean(expensing)}
        footer={null}
        width={1050}
        onCancel={() => setExpensing(null)}
        destroyOnHidden
        loading={expenseTypes.isLoading}
      >
        {expensing && expenseTypes.data ? (
          <PurchaseQuotationExpensesForm
            quotation={expensing}
            expenseTypes={expenseTypes.data.expenseTypes}
            isSubmitting={saveExpenses.isPending}
            onCancel={() => setExpensing(null)}
            onSubmit={async (expenses) => {
              try {
                await saveExpenses.mutateAsync({ item: expensing, expenses });
                await refresh();
                if (detailsId === expensing.id) await details.refetch();
                setExpensing(null);
                message.success('Gastos actualizados correctamente.');
              } catch (error) {
                message.error(error.message);
              }
            }}
          />
        ) : null}
      </Modal>
      <Modal
        title={
          linking
            ? `Solicitudes de origen · ${linking.code}`
            : 'Solicitudes de origen'
        }
        open={Boolean(linking)}
        footer={null}
        width={1100}
        onCancel={() => setLinking(null)}
        destroyOnHidden
        loading={eligibleRequests.isLoading}
      >
        {linking && eligibleRequests.data ? (
          <PurchaseQuotationRequestLinksForm
            quotation={linking}
            purchaseRequests={eligibleRequests.data}
            isSubmitting={saveLinks.isPending}
            onCancel={() => setLinking(null)}
            onSubmit={async (links) => {
              try {
                await saveLinks.mutateAsync({ item: linking, links });
                await Promise.all([
                  refresh(),
                  client.invalidateQueries({ queryKey: ['purchase-requests'] }),
                ]);
                setLinking(null);
                message.success('Solicitudes vinculadas correctamente.');
              } catch (error) {
                message.error(error.message);
              }
            }}
          />
        ) : null}
      </Modal>
    </>
  );
}
