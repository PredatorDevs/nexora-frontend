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
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import { queryKeys } from '@/api/query-keys.js';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { BranchForm } from '@/modules/branches/components/BranchForm.jsx';
import * as api from '@/modules/branches/branches.api.js';
const filters = { page: 1, pageSize: 100, sortBy: 'name', sortOrder: 'asc' };
export function BranchListPage() {
  const { message } = App.useApp();
  const client = useQueryClient();
  const [modal, setModal] = useState(null);
  const [detailsId, setDetailsId] = useState(null);
  const query = useQuery({
    queryKey: queryKeys.branches.list(filters),
    queryFn: () => api.listBranches(filters),
  });
  const detailsQuery = useQuery({
    queryKey: queryKeys.branches.detail(detailsId),
    queryFn: () => api.getBranch(detailsId),
    enabled: Boolean(detailsId),
  });
  const details = detailsQuery.data;
  const create = useMutation({ mutationFn: api.createBranch });
  const update = useMutation({
    mutationFn: ({ id, data }) => api.updateBranch(id, data),
  });
  const status = useMutation({
    mutationFn: ({ branch, next }) =>
      api.changeBranchStatus(branch.id, next, branch.updatedAt),
  });
  const refresh = useCallback(
    () => client.invalidateQueries({ queryKey: queryKeys.branches.all }),
    [client],
  );
  async function submit(data) {
    try {
      if (modal === 'create') {
        await create.mutateAsync(data);
        message.success('Sucursal creada.');
      } else {
        await update.mutateAsync({
          id: modal.id,
          data: { ...data, expectedUpdatedAt: modal.updatedAt },
        });
        message.success('Sucursal actualizada.');
      }
      await refresh();
      setModal(null);
    } catch (error) {
      message.error(error.message);
    }
  }
  const columns = useMemo(
    () => [
      { title: 'Código', dataIndex: 'code' },
      { title: 'Nombre', dataIndex: 'name' },
      {
        title: 'Tipo',
        render: (_, branch) =>
          branch.isHeadquarters ? (
            <Tag color="blue">Casa matriz</Tag>
          ) : (
            'Sucursal'
          ),
      },
      {
        title: 'Ubicación',
        render: (_, branch) =>
          [
            branch.district?.name,
            branch.municipality?.name,
            branch.department?.name,
          ]
            .filter(Boolean)
            .join(', '),
      },
      {
        title: 'Estado',
        dataIndex: 'status',
        render: (value) => <StatusBadge status={value} />,
      },
      {
        title: 'Acciones',
        render: (_, branch) => (
          <Space>
            <Can permission={permissions.branches.read}>
              <Button
                icon={<EyeOutlined />}
                aria-label={`Ver detalle de ${branch.name}`}
                onClick={() => setDetailsId(branch.id)}
              />
            </Can>
            <Can permission={permissions.branches.update}>
              <Button
                icon={<EditOutlined />}
                aria-label={`Editar ${branch.name}`}
                onClick={() => setModal(branch)}
              />
            </Can>
            <Can permission={permissions.branches.changeStatus}>
              <Button
                loading={status.isPending}
                onClick={async () => {
                  try {
                    await status.mutateAsync({
                      branch,
                      next: branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                    });
                    await refresh();
                    message.success('Estado actualizado.');
                  } catch (error) {
                    message.error(error.message);
                  }
                }}
              >
                {branch.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
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
        title="Sucursales"
        description="Administra los puntos operativos de la empresa activa."
        extra={
          <Can permission={permissions.branches.create}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModal('create')}
            >
              Nueva sucursal
            </Button>
          </Can>
        }
      />
      <Card>
        <DataTable
          ariaLabel="Sucursales"
          columns={columns}
          dataSource={query.data?.branches}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          pagination={query.data?.pagination ?? { ...filters, total: 0 }}
        />
      </Card>
      <Modal
        title={modal === 'create' ? 'Nueva sucursal' : 'Editar sucursal'}
        open={Boolean(modal)}
        footer={null}
        width={800}
        onCancel={() => setModal(null)}
        destroyOnHidden
      >
        {modal ? (
          <BranchForm
            key={modal === 'create' ? 'create' : modal.id}
            initialValues={modal === 'create' ? null : modal}
            isSubmitting={create.isPending || update.isPending}
            onCancel={() => setModal(null)}
            onSubmit={submit}
          />
        ) : null}
      </Modal>
      <Modal
        title={details?.name ?? 'Detalle de la sucursal'}
        open={Boolean(detailsId)}
        footer={null}
        width={900}
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
            message="No fue posible cargar la sucursal."
            description={detailsQuery.error.message}
            action={
              <Button onClick={() => detailsQuery.refetch()}>Reintentar</Button>
            }
          />
        ) : details ? (
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="ID">{details.id}</Descriptions.Item>
            <Descriptions.Item label="Código">{details.code}</Descriptions.Item>
            <Descriptions.Item label="Tipo">
              {details.isHeadquarters ? (
                <Tag color="blue">Casa matriz</Tag>
              ) : (
                'Sucursal'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              <StatusBadge status={details.status} />
            </Descriptions.Item>
            <Descriptions.Item label="País">
              {details.country?.name ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Abreviatura del país">
              {details.country?.abbreviation ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Departamento">
              {details.department?.name ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Municipio">
              {details.municipality?.name ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Distrito">
              {details.district?.name ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Área administrativa extranjera">
              {details.foreignAdministrativeArea ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Localidad extranjera">
              {details.foreignLocality ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Dirección" span={2}>
              {details.addressLine}
            </Descriptions.Item>
            <Descriptions.Item label="Teléfono">
              {details.phone ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Correo electrónico">
              {details.email ?? '—'}
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
