import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Modal,
  Space,
  Spin,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { queryKeys } from '@/api/query-keys.js';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { ExpenseTypeForm } from '../components/ExpenseTypeForm.jsx';
import * as api from '../expense-types.api.js';

const filters = { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' };
export function ExpenseTypeListPage() {
  const { message } = App.useApp();
  const client = useQueryClient();
  const [modal, setModal] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const query = useQuery({
    queryKey: queryKeys.expenseTypes.list(filters),
    queryFn: () => api.listExpenseTypes(filters),
  });
  const detailsQuery = useQuery({
    queryKey: queryKeys.expenseTypes.detail(detailsId),
    queryFn: () => api.getExpenseType(detailsId),
    enabled: Boolean(detailsId),
  });
  const create = useMutation({ mutationFn: api.createExpenseType });
  const update = useMutation({
    mutationFn: ({ id, data }) => api.updateExpenseType(id, data),
  });
  const status = useMutation({
    mutationFn: ({ item, next }) =>
      api.changeExpenseTypeStatus(item.id, next, item.updatedAt),
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: queryKeys.expenseTypes.all });
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
      message.success('Tipo de gasto guardado.');
    } catch (error) {
      message.error(error.message);
    }
  }
  const columns = [
    { title: 'Código', dataIndex: 'code' },
    { title: 'Nombre', dataIndex: 'name' },
    { title: 'Descripción', dataIndex: 'description' },
    {
      title: 'Estado',
      render: (_, item) => (
        <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      title: 'Acciones',
      render: (_, item) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            aria-label={`Ver ${item.name}`}
            onClick={() => setDetailsId(item.id)}
          />
          <Can permission={permissions.expenseTypes.update}>
            <Button icon={<EditOutlined />} onClick={() => setModal(item)} />
          </Can>
          <Can permission={permissions.expenseTypes.changeStatus}>
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
  ];
  const details = detailsQuery.data;
  return (
    <>
      <PageHeader
        title="Tipos de gasto"
        description="Administra los conceptos reutilizados por cotizaciones y órdenes de compra."
        extra={
          <Can permission={permissions.expenseTypes.create}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModal('create')}
            >
              Nuevo tipo
            </Button>
          </Can>
        }
      />
      <Card>
        <DataTable
          ariaLabel="Tipos de gasto"
          columns={columns}
          dataSource={query.data?.expenseTypes}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
        />
      </Card>
      <Modal
        title={
          modal === 'create' ? 'Nuevo tipo de gasto' : 'Editar tipo de gasto'
        }
        open={Boolean(modal)}
        footer={null}
        onCancel={() => setModal(null)}
        destroyOnHidden
      >
        {modal ? (
          <ExpenseTypeForm
            key={modal === 'create' ? 'create' : modal.id}
            initialValues={modal === 'create' ? null : modal}
            isSubmitting={create.isPending || update.isPending}
            onCancel={() => setModal(null)}
            onSubmit={submit}
          />
        ) : null}
      </Modal>
      <Modal
        title={details?.name ?? 'Detalle del tipo de gasto'}
        open={Boolean(detailsId)}
        footer={null}
        onCancel={() => setDetailsId(null)}
        destroyOnHidden
      >
        {detailsQuery.isLoading ? (
          <div
            style={{ display: 'grid', minHeight: 150, placeItems: 'center' }}
          >
            <Spin />
          </div>
        ) : detailsQuery.isError ? (
          <Alert
            showIcon
            type="error"
            message="No fue posible cargar el tipo de gasto."
            description={detailsQuery.error.message}
          />
        ) : details ? (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="ID">{details.id}</Descriptions.Item>
            <Descriptions.Item label="Código">{details.code}</Descriptions.Item>
            <Descriptions.Item label="Nombre" span={2}>
              {details.name}
            </Descriptions.Item>
            <Descriptions.Item label="Estado" span={2}>
              <StatusBadge status={details.isActive ? 'ACTIVE' : 'INACTIVE'} />
            </Descriptions.Item>
            <Descriptions.Item label="Descripción" span={2}>
              {details.description ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Creado">
              {dayjs(details.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Actualizado">
              {dayjs(details.updatedAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </>
  );
}
