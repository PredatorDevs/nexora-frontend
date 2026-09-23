import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
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
import { listPurchaseRequests } from '@/modules/purchase-requests/purchase-requests.api.js';
import * as api from '../purchase-orders.api.js';
import { PurchaseOrderExpenses } from '../components/PurchaseOrderExpenses.jsx';
const filters = {
  page: 1,
  pageSize: 100,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};
const labels = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente de aprobación',
  APPROVED: 'Aprobada',
  SENT: 'Enviada',
  PARTIALLY_RECEIVED: 'Recibida parcialmente',
  RECEIVED: 'Recibida',
  CANCELLED: 'Cancelada',
  CLOSED: 'Cerrada',
};
const money = (v, c) =>
  `${Number(v).toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;
export function PurchaseOrderListPage() {
  const { message } = App.useApp(),
    client = useQueryClient();
  const [generating, setGenerating] = useState(false),
    [detailsId, setDetailsId] = useState();
  const query = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => api.listPurchaseOrders(filters),
  });
  const requests = useQuery({
    queryKey: ['purchase-requests', 'order-generation'],
    queryFn: () => listPurchaseRequests({ ...filters, status: 'IN_QUOTATION' }),
    enabled: generating,
  });
  const details = useQuery({
    queryKey: ['purchase-orders', detailsId],
    queryFn: () => api.getPurchaseOrder(detailsId),
    enabled: Boolean(detailsId),
  });
  const generate = useMutation({ mutationFn: api.generatePurchaseOrders });
  const transition = useMutation({
    mutationFn: ({ item, action }) => api.transitionPurchaseOrder(item, action),
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: ['purchase-orders'] });
  async function change(item, action) {
    try {
      await transition.mutateAsync({ item, action });
      await refresh();
      message.success('Orden actualizada.');
    } catch (e) {
      message.error(e.message);
    }
  }
  const columns = [
    { title: 'Código', dataIndex: 'code' },
    { title: 'Proveedor', render: (_, x) => x.supplier.name },
    {
      title: 'Destino',
      render: (_, x) => `${x.branch.name} · ${x.warehouse.name}`,
    },
    {
      title: 'Fecha',
      render: (_, x) => dayjs(x.orderDate).format('DD/MM/YYYY'),
    },
    { title: 'Total', render: (_, x) => money(x.total, x.currencyCode) },
    { title: 'Estado', render: (_, x) => <Tag>{labels[x.status]}</Tag> },
    {
      title: 'Acciones',
      render: (_, x) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setDetailsId(x.id)} />
          {x.status === 'DRAFT' ? (
            <Can permission={permissions.purchaseOrders.submit}>
              <Popconfirm
                title="¿Enviar a aprobación?"
                onConfirm={() => change(x, 'submit')}
              >
                <Button>Solicitar aprobación</Button>
              </Popconfirm>
            </Can>
          ) : null}
          {x.status === 'PENDING_APPROVAL' ? (
            <Can permission={permissions.purchaseOrders.approve}>
              <Button type="primary" onClick={() => change(x, 'approve')}>
                Aprobar
              </Button>
            </Can>
          ) : null}
          {x.status === 'APPROVED' ? (
            <Can permission={permissions.purchaseOrders.send}>
              <Button onClick={() => change(x, 'send')}>Marcar enviada</Button>
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
        title="Órdenes de compra"
        description="Genera y administra órdenes a partir de adjudicaciones aprobadas."
        extra={
          <Can permission={permissions.purchaseOrders.create}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setGenerating(true)}
            >
              Generar órdenes
            </Button>
          </Can>
        }
      />
      <Card>
        <DataTable
          ariaLabel="Órdenes de compra"
          columns={columns}
          dataSource={query.data?.purchaseOrders}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
        />
      </Card>
      <Modal
        title="Generar órdenes desde adjudicación"
        open={generating}
        footer={null}
        onCancel={() => setGenerating(false)}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          onFinish={async (v) => {
            try {
              await generate.mutateAsync({
                ...v,
                orderDate: v.orderDate.toISOString(),
                expectedDate: v.expectedDate.toISOString(),
              });
              await refresh();
              setGenerating(false);
              message.success('Órdenes generadas.');
            } catch (e) {
              message.error(e.message);
            }
          }}
        >
          <Form.Item
            name="purchaseRequestId"
            label="Solicitud"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={requests.data?.purchaseRequests.map((x) => ({
                value: x.id,
                label: x.code,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="orderDate"
            label="Fecha de orden"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="expectedDate"
            label="Fecha esperada"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={generate.isPending}>
            Generar
          </Button>
        </Form>
      </Modal>
      <Modal
        title={value ? `Orden ${value.code}` : 'Detalle'}
        open={Boolean(detailsId)}
        footer={null}
        width={1100}
        onCancel={() => setDetailsId(null)}
        loading={details.isLoading}
      >
        {value ? (
          <>
            <Descriptions
              bordered
              column={2}
              items={[
                {
                  key: 'supplier',
                  label: 'Proveedor',
                  children: value.supplier.name,
                },
                {
                  key: 'destination',
                  label: 'Destino',
                  children: `${value.branch.name} · ${value.warehouse.name}`,
                },
                {
                  key: 'quotation',
                  label: 'Cotización origen',
                  children: value.purchaseQuotation?.code ?? '—',
                },
                {
                  key: 'status',
                  label: 'Estado',
                  children: labels[value.status],
                },
                {
                  key: 'dates',
                  label: 'Orden / Esperada',
                  children: `${dayjs(value.orderDate).format('DD/MM/YYYY')} · ${dayjs(value.expectedDate).format('DD/MM/YYYY')}`,
                },
                {
                  key: 'totals',
                  label: 'Subtotal / Descuento / Impuesto / Gastos / Total',
                  span: 2,
                  children: `${money(value.subtotal, value.currencyCode)} · ${money(value.discount, value.currencyCode)} · ${money(value.tax, value.currencyCode)} · ${money(value.additionalExpenses, value.currencyCode)} · ${money(value.total, value.currencyCode)}`,
                },
              ]}
            />
            <Table
              rowKey="id"
              pagination={false}
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
                  title: 'Precio',
                  render: (_, x) => money(x.unitPrice, value.currencyCode),
                },
                {
                  title: 'Total',
                  render: (_, x) => money(x.total, value.currencyCode),
                },
              ]}
            />
            <PurchaseOrderExpenses
              order={value}
              onChange={(updated) => {
                if (updated)
                  client.setQueryData(['purchase-orders', detailsId], updated);
                else details.refetch();
                refresh();
              }}
            />
          </>
        ) : null}
      </Modal>
    </>
  );
}
