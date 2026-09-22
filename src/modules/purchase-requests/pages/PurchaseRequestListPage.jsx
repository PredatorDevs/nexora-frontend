import {
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SendOutlined,
} from '@ant-design/icons';
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
import { PurchaseRequestForm } from '../components/PurchaseRequestForm.jsx';
import * as api from '../purchase-requests.api.js';

const filters = {
  page: 1,
  pageSize: 100,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};
const labels = {
  DRAFT: 'Borrador',
  SUBMITTED: 'Enviada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  IN_QUOTATION: 'En cotización',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};
const colors = {
  DRAFT: 'default',
  SUBMITTED: 'processing',
  APPROVED: 'success',
  REJECTED: 'error',
  IN_QUOTATION: 'purple',
  COMPLETED: 'green',
  CANCELLED: 'warning',
};

export function PurchaseRequestListPage() {
  const { message, modal: dialog } = App.useApp();
  const client = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const [status, setStatus] = useState();
  const query = useQuery({
    queryKey: ['purchase-requests', 'list', status],
    queryFn: () =>
      api.listPurchaseRequests({ ...filters, ...(status ? { status } : {}) }),
  });
  const details = useQuery({
    queryKey: ['purchase-requests', 'detail', detailsId],
    queryFn: () => api.getPurchaseRequest(detailsId),
    enabled: Boolean(detailsId),
  });
  const save = useMutation({
    mutationFn: ({ item, data }) =>
      item === 'create'
        ? api.createPurchaseRequest(data)
        : api.updatePurchaseRequest(item.id, {
            ...data,
            expectedUpdatedAt: item.updatedAt,
          }),
  });
  const transition = useMutation({
    mutationFn: ({ item, action, reason }) =>
      api.transitionPurchaseRequest(item.id, action, item.updatedAt, reason),
  });
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ['purchase-requests'] });
  };
  async function change(item, action, reason) {
    try {
      await transition.mutateAsync({ item, action, reason });
      await refresh();
      if (detailsId === item.id) details.refetch();
      message.success('Solicitud actualizada.');
    } catch (error) {
      message.error(error.message);
    }
  }
  function reasonDialog(item, action) {
    let reason = '';
    dialog.confirm({
      title: action === 'reject' ? 'Rechazar solicitud' : 'Cancelar solicitud',
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
      okButtonProps: { danger: true },
      okText: 'Confirmar',
      onOk: async () => {
        if (!reason.trim()) {
          message.warning('Ingresa un motivo.');
          throw new Error('reason required');
        }
        await change(item, action, reason.trim());
      },
    });
  }
  const columns = [
    { title: 'Código', dataIndex: 'code' },
    { title: 'Sucursal', render: (_, item) => item.branch.name },
    { title: 'Almacén', render: (_, item) => item.warehouse.name },
    { title: 'Solicitante', render: (_, item) => item.requestedBy.displayName },
    {
      title: 'Requerida',
      render: (_, item) => dayjs(item.requiredDate).format('DD/MM/YYYY'),
    },
    {
      title: 'Estado',
      render: (_, item) => (
        <Tag color={colors[item.status]}>{labels[item.status]}</Tag>
      ),
    },
    {
      title: 'Acciones',
      render: (_, item) => (
        <Space wrap>
          <Button
            icon={<EyeOutlined />}
            aria-label={`Ver ${item.code}`}
            onClick={() => setDetailsId(item.id)}
          />
          {item.status === 'DRAFT' ? (
            <Can permission={permissions.purchaseRequests.update}>
              <Button
                icon={<EditOutlined />}
                onClick={() => setEditing(item)}
              />
            </Can>
          ) : null}
          {item.status === 'DRAFT' ? (
            <Can permission={permissions.purchaseRequests.submit}>
              <Popconfirm
                title="¿Enviar esta solicitud a aprobación?"
                onConfirm={() => change(item, 'submit')}
              >
                <Button icon={<SendOutlined />}>Enviar</Button>
              </Popconfirm>
            </Can>
          ) : null}
          {item.status === 'SUBMITTED' ? (
            <>
              <Can permission={permissions.purchaseRequests.approve}>
                <Popconfirm
                  title="¿Aprobar esta solicitud?"
                  onConfirm={() => change(item, 'approve')}
                >
                  <Button type="primary">Aprobar</Button>
                </Popconfirm>
              </Can>
              <Can permission={permissions.purchaseRequests.reject}>
                <Button danger onClick={() => reasonDialog(item, 'reject')}>
                  Rechazar
                </Button>
              </Can>
            </>
          ) : null}
          {['DRAFT', 'SUBMITTED', 'APPROVED'].includes(item.status) ? (
            <Can permission={permissions.purchaseRequests.cancel}>
              <Button danger onClick={() => reasonDialog(item, 'cancel')}>
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
        title="Solicitudes de compra"
        description="Registra necesidades internas y controla su aprobación antes de cotizar."
        extra={
          <Can permission={permissions.purchaseRequests.create}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setEditing('create')}
            >
              Nueva solicitud
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
          ariaLabel="Solicitudes de compra"
          columns={columns}
          dataSource={query.data?.purchaseRequests}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
        />
      </Card>
      <Modal
        title={
          editing === 'create'
            ? 'Nueva solicitud de compra'
            : 'Editar solicitud de compra'
        }
        open={Boolean(editing)}
        footer={null}
        width={1100}
        onCancel={() => setEditing(null)}
        destroyOnHidden
      >
        <PurchaseRequestForm
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
        title={value ? `Solicitud ${value.code}` : 'Detalle de solicitud'}
        open={Boolean(detailsId)}
        footer={null}
        width={1000}
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
                { key: 'id', label: 'ID', children: value.id },
                { key: 'uuid', label: 'UUID', children: value.uuid },
                { key: 'code', label: 'Código', children: value.code },
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
                  key: 'requester',
                  label: 'Solicitante',
                  children: `${value.requestedBy.displayName} · ${value.requestedBy.email}`,
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
                  key: 'requestDate',
                  label: 'Fecha de solicitud',
                  children: dayjs(value.requestDate).format('DD/MM/YYYY HH:mm'),
                },
                {
                  key: 'requiredDate',
                  label: 'Fecha requerida',
                  children: dayjs(value.requiredDate).format('DD/MM/YYYY'),
                },
                {
                  key: 'submittedAt',
                  label: 'Enviada a aprobación',
                  children: value.submittedAt
                    ? dayjs(value.submittedAt).format('DD/MM/YYYY HH:mm')
                    : '—',
                },
                {
                  key: 'approvedAt',
                  label: 'Aprobada',
                  children: value.approvedAt
                    ? `${dayjs(value.approvedAt).format('DD/MM/YYYY HH:mm')} · ${value.approvedBy?.displayName ?? '—'}`
                    : '—',
                },
                {
                  key: 'rejectedAt',
                  label: 'Rechazada',
                  children: value.rejectedAt
                    ? `${dayjs(value.rejectedAt).format('DD/MM/YYYY HH:mm')} · ${value.rejectedBy?.displayName ?? '—'}`
                    : '—',
                },
                {
                  key: 'cancelledAt',
                  label: 'Cancelada',
                  children: value.cancelledAt
                    ? `${dayjs(value.cancelledAt).format('DD/MM/YYYY HH:mm')} · ${value.cancelledBy?.displayName ?? '—'}`
                    : '—',
                },
                {
                  key: 'justification',
                  label: 'Justificación',
                  span: 2,
                  children: value.justification,
                },
                {
                  key: 'notes',
                  label: 'Notas',
                  span: 2,
                  children: value.notes || '—',
                },
                {
                  key: 'rejection',
                  label: 'Motivo de rechazo',
                  span: 2,
                  children: value.rejectionReason || '—',
                },
                {
                  key: 'cancellation',
                  label: 'Motivo de cancelación',
                  span: 2,
                  children: value.cancellationReason || '—',
                },
                {
                  key: 'createdAt',
                  label: 'Creada',
                  children: dayjs(value.createdAt).format('DD/MM/YYYY HH:mm'),
                },
                {
                  key: 'updatedAt',
                  label: 'Última actualización',
                  children: dayjs(value.updatedAt).format('DD/MM/YYYY HH:mm'),
                },
              ]}
            />
            <Table
              style={{ marginTop: 16 }}
              rowKey="id"
              pagination={false}
              dataSource={value.details}
              columns={[
                { title: '#', dataIndex: 'lineNumber' },
                {
                  title: 'Producto',
                  render: (_, row) =>
                    `${row.product.internalCode} · ${row.product.name}`,
                },
                {
                  title: 'SKU',
                  render: (_, row) => row.product.sku || '—',
                },
                { title: 'Cantidad', dataIndex: 'quantity' },
                {
                  title: 'Unidad',
                  render: (_, row) =>
                    `${row.productUnit.name}${row.productUnit.measurementUnit?.symbol ? ` (${row.productUnit.measurementUnit.symbol})` : ''}`,
                },
                {
                  title: 'Descripción',
                  render: (_, row) => row.description || '—',
                },
                { title: 'Notas', render: (_, row) => row.notes || '—' },
              ]}
            />
          </>
        ) : null}
      </Modal>
    </>
  );
}
