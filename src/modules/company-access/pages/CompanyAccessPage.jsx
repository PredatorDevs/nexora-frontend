import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Form, Input, Modal, Select, Space, Tabs, Tag, Typography } from 'antd';
import { useState } from 'react';

import { queryKeys } from '@/api/query-keys.js';
import { useAuth } from '@/auth/useAuth.js';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import * as api from '@/modules/company-access/company-access.api.js';

export function CompanyAccessPage() {
  const { activeMembership } = useAuth();
  const companyId = activeMembership?.companyId;
  const { message } = App.useApp();
  const client = useQueryClient();
  const [memberOpen, setMemberOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const members = useQuery({ queryKey: queryKeys.companyAccess.members(companyId), queryFn: () => api.listMembers(companyId), enabled: Boolean(companyId) });
  const roles = useQuery({ queryKey: queryKeys.companyAccess.roles(companyId), queryFn: () => api.listRoles(companyId), enabled: Boolean(companyId) });
  const addMember = useMutation({ mutationFn: (values) => api.addMember(companyId, values), onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.companyAccess.members(companyId) }) });
  const createRole = useMutation({ mutationFn: (values) => api.createRole(companyId, values), onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.companyAccess.roles(companyId) }) });
  async function execute(mutation, values, close, success) { try { await mutation.mutateAsync(values); message.success(success); close(false); } catch (error) { message.error(error.message); } }
  const roleOptions = roles.data?.map((role) => ({ value: role.id, label: role.name })) ?? [];
  const memberColumns = [
    { title: 'Usuario', render: (_, item) => item.user?.displayName },
    { title: 'Correo', render: (_, item) => item.user?.email },
    { title: 'Estado', dataIndex: 'status', render: (value) => <StatusBadge status={value} /> },
    { title: 'Roles', render: (_, item) => <Space wrap>{item.roles?.map(({ role }) => <Tag key={role.id}>{role.name}</Tag>)}</Space> },
  ];
  const roleColumns = [
    { title: 'CÃ³digo', dataIndex: 'code' }, { title: 'Nombre', dataIndex: 'name' },
    { title: 'Tipo', render: (_, role) => role.isSystem ? <Tag color="blue">Sistema</Tag> : <Tag>Personalizado</Tag> },
    { title: 'Permisos', render: (_, role) => role.permissions?.length ?? 0 },
  ];
  return <>
    <PageHeader title="Acceso de empresa" description={`Miembros y roles de ${activeMembership?.company.commercialName || activeMembership?.company.legalName || 'la empresa activa'}.`} />
    <Tabs items={[
      { key: 'members', label: 'Miembros', children: <Card extra={<Can permission={permissions.companyMembers.add}><Button icon={<PlusOutlined />} onClick={() => setMemberOpen(true)}>Agregar miembro</Button></Can>}><DataTable ariaLabel="Miembros" columns={memberColumns} dataSource={members.data} isLoading={members.isLoading} error={members.error} onRetry={members.refetch} pagination={false} /></Card> },
      { key: 'roles', label: 'Roles', children: <Card extra={<Can permission={permissions.companyRoles.create}><Button icon={<PlusOutlined />} onClick={() => setRoleOpen(true)}>Nuevo rol</Button></Can>}><DataTable ariaLabel="Roles de empresa" columns={roleColumns} dataSource={roles.data} isLoading={roles.isLoading} error={roles.error} onRetry={roles.refetch} pagination={false} /></Card> },
    ]} />
    <Modal title="Agregar miembro" open={memberOpen} onCancel={() => setMemberOpen(false)} footer={null} destroyOnHidden><Form layout="vertical" onFinish={(v) => execute(addMember, v, setMemberOpen, 'Miembro agregado.')}><Typography.Paragraph type="secondary">El usuario debe existir previamente como identidad global.</Typography.Paragraph><Form.Item name="email" label="Correo" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item><Form.Item name="roleIds" label="Roles" rules={[{ required: true }]}><Select mode="multiple" options={roleOptions} /></Form.Item><Button type="primary" htmlType="submit" loading={addMember.isPending}>Agregar</Button></Form></Modal>
    <Modal title="Nuevo rol" open={roleOpen} onCancel={() => setRoleOpen(false)} footer={null} destroyOnHidden><Form layout="vertical" onFinish={(v) => execute(createRole, v, setRoleOpen, 'Rol creado.')}><Form.Item name="code" label="CÃ³digo" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="name" label="Nombre" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="description" label="DescripciÃ³n"><Input.TextArea /></Form.Item><Button type="primary" htmlType="submit" loading={createRole.isPending}>Crear rol</Button></Form></Modal>
  </>;
}
