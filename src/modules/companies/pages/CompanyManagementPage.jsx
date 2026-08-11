import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Modal, Space } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { queryKeys } from '@/api/query-keys.js';
import { useAuth } from '@/auth/useAuth.js';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { CompanyForm } from '@/modules/companies/components/CompanyForm.jsx';
import * as api from '@/modules/companies/companies.api.js';

const listParams = {
  page: 1,
  pageSize: 100,
  sortBy: 'legalName',
  sortOrder: 'asc',
};
const formValues = (company) => ({
  ...company,
  economicActivityIds:
    company.economicActivities?.map(
      ({ economicActivity }) => economicActivity.id,
    ) ?? [],
});

export function CompanyManagementPage() {
  const { message } = App.useApp();
  const client = useQueryClient();
  const { refreshCompanyContext } = useAuth();
  const [modal, setModal] = useState(null);
  const query = useQuery({
    queryKey: queryKeys.companies.list(listParams),
    queryFn: () => api.listCompanies(listParams),
  });
  const create = useMutation({ mutationFn: api.createCompany });
  const update = useMutation({
    mutationFn: ({ id, data }) => api.updateCompany(id, data),
  });
  const status = useMutation({
    mutationFn: ({ id, next, updatedAt }) =>
      api.changeCompanyStatus(id, next, updatedAt),
  });
  const refresh = useCallback(
    () => client.invalidateQueries({ queryKey: queryKeys.companies.all }),
    [client],
  );
  async function submit(data) {
    try {
      if (modal === 'create') {
        await create.mutateAsync(data);
        await refreshCompanyContext();
        message.success('Empresa creada.');
      } else {
        await update.mutateAsync({
          id: modal.id,
          data: { ...data, expectedUpdatedAt: modal.updatedAt },
        });
        message.success('Empresa actualizada.');
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
      { title: 'Razón social', dataIndex: 'legalName' },
      { title: 'Nombre comercial', dataIndex: 'commercialName' },
      { title: 'NIT', dataIndex: 'nit' },
      {
        title: 'Estado',
        dataIndex: 'status',
        render: (value) => <StatusBadge status={value} />,
      },
      {
        title: 'Acciones',
        render: (_, company) => (
          <Space>
            <Can permission={permissions.companies.update}>
              <Button
                aria-label={`Editar ${company.legalName}`}
                icon={<EditOutlined />}
                onClick={() => setModal(company)}
              />
            </Can>
            <Can permission={permissions.companies.changeStatus}>
              <Button
                loading={status.isPending}
                onClick={async () => {
                  try {
                    await status.mutateAsync({
                      id: company.id,
                      next: company.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                      updatedAt: company.updatedAt,
                    });
                    await refresh();
                    message.success('Estado actualizado.');
                  } catch (error) {
                    message.error(error.message);
                  }
                }}
              >
                {company.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
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
        title="Empresas"
        description="Administra las entidades legales disponibles en Nexora."
        extra={
          <Can permission={permissions.companies.create}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModal('create')}
            >
              Nueva empresa
            </Button>
          </Can>
        }
      />
      <Card>
        <DataTable
          ariaLabel="Empresas"
          columns={columns}
          dataSource={query.data?.companies}
          isLoading={query.isLoading}
          error={query.error}
          onRetry={query.refetch}
          pagination={
            query.data?.pagination ?? { page: 1, pageSize: 100, total: 0 }
          }
        />
      </Card>
      <Modal
        title={modal === 'create' ? 'Nueva empresa' : 'Editar empresa'}
        open={Boolean(modal)}
        onCancel={() => setModal(null)}
        footer={null}
        width={900}
        destroyOnHidden
      >
        {modal ? (
          <CompanyForm
            key={modal === 'create' ? 'create' : modal.id}
            initialValues={modal === 'create' ? null : formValues(modal)}
            isSubmitting={create.isPending || update.isPending}
            onCancel={() => setModal(null)}
            onSubmit={submit}
          />
        ) : null}
      </Modal>
    </>
  );
}
