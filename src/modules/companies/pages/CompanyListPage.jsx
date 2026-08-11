import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Form, Input, InputNumber, Modal, Select, Space } from 'antd';
import { useMemo, useState } from 'react';

import { queryKeys } from '@/api/query-keys.js';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { useAuth } from '@/auth/useAuth.js';
import * as api from '@/modules/companies/companies.api.js';

const defaults = { defaultCurrencyCode: 'USD', timezone: 'America/El_Salvador', locale: 'es-SV' };

export function CompanyListPage() {
  const { message } = App.useApp();
  const client = useQueryClient();
  const { refreshCompanyContext } = useAuth();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const query = useQuery({ queryKey: queryKeys.companies.list({ page: 1, pageSize: 100 }), queryFn: () => api.listCompanies({ page: 1, pageSize: 100, sortBy: 'legalName', sortOrder: 'asc' }) });
  const create = useMutation({ mutationFn: api.createCompany, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.companies.all }) });
  const status = useMutation({ mutationFn: ({ id, next, updatedAt }) => api.changeCompanyStatus(id, next, updatedAt), onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.companies.all }) });

  async function submit(values) {
    try {
      const activityTypes = ['PRIMARY', 'SECONDARY', 'TERTIARY'];
      await create.mutateAsync({ ...values, ...defaults, economicActivities: values.economicActivityIds.map((id, index) => ({ economicActivityId: Number(id), type: activityTypes[index] })) });
      await refreshCompanyContext();
      message.success('Empresa creada.'); form.resetFields(); setOpen(false);
    } catch (error) { message.error(error.message); }
  }
  const columns = useMemo(() => [
    { title: 'CÃ³digo', dataIndex: 'code' },
    { title: 'RazÃ³n social', dataIndex: 'legalName' },
    { title: 'Nombre comercial', dataIndex: 'commercialName' },
    { title: 'NIT', dataIndex: 'nit' },
    { title: 'Estado', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
    { title: 'Acciones', render: (_, company) => <Can permission={permissions.companies.changeStatus}><Button loading={status.isPending} onClick={async () => { try { await status.mutateAsync({ id: company.id, next: company.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', updatedAt: company.updatedAt }); message.success('Estado actualizado.'); } catch (error) { message.error(error.message); } }}>{company.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}</Button></Can> },
  ], [message, status]);
  return <>
    <PageHeader title="Empresas" description="Administra las entidades legales disponibles en Nexora." extra={<Can permission={permissions.companies.create}><Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Nueva empresa</Button></Can>} />
    <Card><DataTable ariaLabel="Empresas" columns={columns} dataSource={query.data?.companies} isLoading={query.isLoading} error={query.error} onRetry={query.refetch} pagination={query.data?.pagination ?? { page: 1, pageSize: 100, total: 0 }} /></Card>
    <Modal title="Nueva empresa" open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={create.isPending} width={760} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={submit} initialValues={{ economicActivityIds: [] }}>
        <Space wrap align="start">
          <Form.Item name="code" label="CÃ³digo" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="legalName" label="RazÃ³n social" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="commercialName" label="Nombre comercial" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="nit" label="NIT" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="nrc" label="NRC" rules={[{ required: true }]}><Input /></Form.Item>
          {['countryId','departmentId','municipalityId','districtId'].map((name) => <Form.Item key={name} name={name} label={{countryId:'PaÃ­s',departmentId:'Departamento',municipalityId:'Municipio',districtId:'Distrito'}[name] + ' (ID)'} rules={[{ required: true }]}><InputNumber min={1} /></Form.Item>)}
        </Space>
        <Form.Item name="addressLine" label="DirecciÃ³n" rules={[{ required: true }]}><Input.TextArea /></Form.Item>
        <Space wrap align="start"><Form.Item name="phone" label="TelÃ©fono"><Input /></Form.Item><Form.Item name="email" label="Correo"><Input /></Form.Item><Form.Item name="website" label="Sitio web"><Input /></Form.Item></Space>
        <Form.Item name="economicActivityIds" label="IDs de actividades econÃ³micas (principal primero)" rules={[{ required: true }]}><Select mode="tags" maxCount={3} tokenSeparators={[',']} /></Form.Item>
      </Form>
    </Modal>
  </>;
}
