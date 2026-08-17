import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useState } from 'react';
import { queryKeys } from '@/api/query-keys.js';
import { useAuth } from '@/auth/useAuth.js';
import { Can } from '@/components/authorization/Can.jsx';
import { DataTable } from '@/components/tables/DataTable.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { PermissionMatrix } from '@/modules/roles/components/PermissionMatrix.jsx';
import * as api from '@/modules/company-access/company-access.api.js';

const permissionCatalog = [
  ...Object.values(permissions.companyMembers),
  ...Object.values(permissions.companyRoles),
  ...Object.values(permissions.branches),
  ...Object.values(permissions.warehouseCategories),
  'address_dictionaries.read',
  'economic_activities.read',
].map((code) => {
  const [resource, action] = code.split('.');
  return { code, resource, action, description: null };
});

export function CompanyAccessManagementPage() {
  const { activeMembership } = useAuth();
  const companyId = activeMembership?.companyId;
  const { message, modal: dialog } = App.useApp();
  const client = useQueryClient();
  const [memberModal, setMemberModal] = useState(null);
  const [roleModal, setRoleModal] = useState(null);
  const members = useQuery({
    queryKey: queryKeys.companyAccess.members(companyId),
    queryFn: () => api.listMembers(companyId),
    enabled: Boolean(companyId),
  });
  const roles = useQuery({
    queryKey: queryKeys.companyAccess.roles(companyId),
    queryFn: () => api.listRoles(companyId),
    enabled: Boolean(companyId),
  });
  const invitations = useQuery({
    queryKey: ['company-access', companyId, 'invitations'],
    queryFn: () => api.listInvitations(companyId),
    enabled: Boolean(companyId),
  });
  const refreshMembers = () =>
    client.invalidateQueries({
      queryKey: queryKeys.companyAccess.members(companyId),
    });
  const refreshRoles = () =>
    client.invalidateQueries({
      queryKey: queryKeys.companyAccess.roles(companyId),
    });
  const refreshInvitations = () =>
    client.invalidateQueries({
      queryKey: ['company-access', companyId, 'invitations'],
    });
  const mutations = {
    addMember: useMutation({ mutationFn: (v) => api.inviteMember(companyId, v) }),
    memberRoles: useMutation({
      mutationFn: ({ member, roleIds }) =>
        api.replaceMemberRoles(companyId, member.id, roleIds, member.updatedAt),
    }),
    memberStatus: useMutation({
      mutationFn: ({ member, status }) =>
        api.changeMemberStatus(companyId, member.id, status, member.updatedAt),
    }),
    createRole: useMutation({
      mutationFn: (v) => api.createRole(companyId, v),
    }),
    updateRole: useMutation({
      mutationFn: ({ role, values }) =>
        api.updateRole(companyId, role.id, {
          ...values,
          expectedUpdatedAt: role.updatedAt,
        }),
    }),
    permissions: useMutation({
      mutationFn: ({ role, codes }) =>
        api.replaceRolePermissions(companyId, role.id, codes, role.updatedAt),
    }),
    deleteRole: useMutation({
      mutationFn: (role) => api.deleteRole(companyId, role.id, role.updatedAt),
    }),
    revokeInvitation: useMutation({
      mutationFn: (invitation) =>
        api.revokeInvitation(companyId, invitation.id),
    }),
  };
  async function run(operation, refresh, success, close) {
    try {
      const result = await operation();
      await refresh();
      message.success(typeof success === 'function' ? success(result) : success);
      close?.();
    } catch (error) {
      message.error(error.message);
    }
  }
  const roleOptions =
    roles.data?.map((role) => ({ value: role.id, label: role.name })) ?? [];
  const memberColumns = [
    { title: 'Usuario', render: (_, item) => item.user?.displayName },
    { title: 'Correo', render: (_, item) => item.user?.email },
    {
      title: 'Estado',
      dataIndex: 'status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      title: 'Roles',
      render: (_, item) => (
        <Space wrap>
          {item.roles?.map(({ role }) => (
            <Tag key={role.id}>{role.name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Acciones',
      render: (_, member) => (
        <Space>
          <Can permission={permissions.companyMembers.assignRoles}>
            <Button
              icon={<EditOutlined />}
              aria-label={`Editar roles de ${member.user?.displayName}`}
              onClick={() => setMemberModal({ type: 'roles', member })}
            />
          </Can>
          <Can permission={permissions.companyMembers.changeStatus}>
            <Button
              onClick={() =>
                run(
                  () =>
                    mutations.memberStatus.mutateAsync({
                      member,
                      status:
                        member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                    }),
                  refreshMembers,
                  'Estado actualizado.',
                )
              }
            >
              {member.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
            </Button>
          </Can>
        </Space>
      ),
    },
  ];
  const roleColumns = [
    { title: 'Código', dataIndex: 'code' },
    { title: 'Nombre', dataIndex: 'name' },
    {
      title: 'Tipo',
      render: (_, role) =>
        role.isSystem ? (
          <Tag color="blue">Sistema</Tag>
        ) : (
          <Tag>Personalizado</Tag>
        ),
    },
    { title: 'Permisos', render: (_, role) => role.permissions?.length ?? 0 },
    {
      title: 'Acciones',
      render: (_, role) => (
        <Space>
          <Can permission={permissions.companyRoles.update}>
            <Button
              icon={<EditOutlined />}
              disabled={role.isSystem}
              onClick={() => setRoleModal({ type: 'edit', role })}
            />
          </Can>
          <Can permission={permissions.companyRoles.assignPermissions}>
            <Button
              icon={<SafetyOutlined />}
              disabled={role.isSystem}
              onClick={() => setRoleModal({ type: 'permissions', role })}
            >
              Permisos
            </Button>
          </Can>
          <Can permission={permissions.companyRoles.delete}>
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={role.isSystem}
              onClick={() =>
                dialog.confirm({
                  title: 'Eliminar rol',
                  content: `Se eliminará ${role.name}.`,
                  okText: 'Eliminar',
                  okButtonProps: { danger: true },
                  onOk: () =>
                    run(
                      () => mutations.deleteRole.mutateAsync(role),
                      refreshRoles,
                      'Rol eliminado.',
                    ),
                })
              }
            />
          </Can>
        </Space>
      ),
    },
  ];
  const invitationColumns = [
    { title: 'Correo', dataIndex: 'email' },
    {
      title: 'Roles',
      render: (_, invitation) =>
        invitation.roles.map(({ role }) => <Tag key={role.id}>{role.name}</Tag>),
    },
    { title: 'Estado', dataIndex: 'status' },
    {
      title: 'Expira',
      dataIndex: 'expiresAt',
      render: (value) => new Date(value).toLocaleString(),
    },
    {
      title: 'Acciones',
      render: (_, invitation) =>
        invitation.status === 'PENDING' ? (
          <Button
            danger
            onClick={() =>
              run(
                () => mutations.revokeInvitation.mutateAsync(invitation),
                refreshInvitations,
                'Invitación revocada.',
              )
            }
          >
            Revocar
          </Button>
        ) : null,
    },
  ];
  return (
    <>
      <PageHeader
        title="Acceso de empresa"
        description={`Miembros y roles de ${activeMembership?.company.commercialName || activeMembership?.company.legalName || 'la empresa activa'}.`}
      />
      <Tabs
        items={[
          {
            key: 'members',
            label: 'Miembros',
            children: (
              <Card
                extra={
                  <Can permission={permissions.companyMembers.add}>
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => setMemberModal({ type: 'add' })}
                    >
                      Agregar miembro
                    </Button>
                  </Can>
                }
              >
                <DataTable
                  ariaLabel="Miembros"
                  columns={memberColumns}
                  dataSource={members.data}
                  isLoading={members.isLoading}
                  error={members.error}
                  onRetry={members.refetch}
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'roles',
            label: 'Roles',
            children: (
              <Card
                extra={
                  <Can permission={permissions.companyRoles.create}>
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => setRoleModal({ type: 'create' })}
                    >
                      Nuevo rol
                    </Button>
                  </Can>
                }
              >
                <DataTable
                  ariaLabel="Roles de empresa"
                  columns={roleColumns}
                  dataSource={roles.data}
                  isLoading={roles.isLoading}
                  error={roles.error}
                  onRetry={roles.refetch}
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'invitations',
            label: 'Invitaciones',
            children: (
              <Card>
                <DataTable
                  ariaLabel="Invitaciones"
                  columns={invitationColumns}
                  dataSource={invitations.data}
                  isLoading={invitations.isLoading}
                  error={invitations.error}
                  onRetry={invitations.refetch}
                  pagination={false}
                />
              </Card>
            ),
          },
        ]}
      />
      <MemberModal
        state={memberModal}
        roles={roleOptions}
        mutations={mutations}
        close={() => setMemberModal(null)}
        run={run}
        refresh={refreshMembers}
        refreshInvitations={refreshInvitations}
        showInvitation={(invitation) => {
          if (!invitation.acceptanceUrl) return;
          dialog.info({
            title: 'Invitación creada',
            content: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Typography.Paragraph>
                  Comparte este enlace con la persona invitada. Expira en siete dÃ­as.
                </Typography.Paragraph>
                <Input.TextArea readOnly value={invitation.acceptanceUrl} autoSize />
              </Space>
            ),
            width: 620,
          });
        }}
      />
      <RoleModal
        state={roleModal}
        mutations={mutations}
        close={() => setRoleModal(null)}
        run={run}
        refresh={refreshRoles}
      />
    </>
  );
}

function MemberModal({ state, roles, mutations, close, run, refresh, refreshInvitations, showInvitation }) {
  if (!state) return null;
  const editing = state.type === 'roles';
  const initialValues = editing
    ? { roleIds: state.member.roles.map(({ role }) => role.id) }
    : undefined;
  return (
    <Modal
      title={editing ? 'Asignar roles' : 'Agregar miembro'}
      open
      footer={null}
      onCancel={close}
      destroyOnHidden
    >
      <Form
        layout="vertical"
        initialValues={initialValues}
        onFinish={(values) =>
          run(
            () =>
              editing
                ? mutations.memberRoles.mutateAsync({
                    member: state.member,
                    roleIds: values.roleIds,
                  })
                : mutations.addMember.mutateAsync(values),
            editing ? refresh : refreshInvitations,
            editing
              ? 'Roles actualizados.'
              : (invitation) => {
                  showInvitation(invitation);
                  return 'Invitación creada.';
                },
            close,
          )
        }
      >
        {!editing && (
          <>
            <Typography.Paragraph type="secondary">
              Se creará una invitación segura. Si el correo no tiene cuenta,
              la persona podrá crearla al aceptar.
            </Typography.Paragraph>
            <Form.Item
              name="email"
              label="Correo"
              rules={[{ required: true, type: 'email' }]}
            >
              <Input />
            </Form.Item>
          </>
        )}
        <Form.Item
          name="roleIds"
          label="Roles"
          rules={[{ required: true, type: 'array', min: 1 }]}
        >
          <Select mode="multiple" options={roles} />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Guardar
        </Button>
      </Form>
    </Modal>
  );
}

function RoleModal({ state, mutations, close, run, refresh }) {
  if (!state) return null;
  const permissionsMode = state.type === 'permissions';
  const editing = state.type === 'edit';
  const initialValues = permissionsMode
    ? {
        permissionCodes: state.role.permissions.map(
          ({ permission }) => permission.code,
        ),
      }
    : editing
      ? { name: state.role.name, description: state.role.description }
      : undefined;
  return (
    <Modal
      title={
        permissionsMode
          ? 'Permisos del rol'
          : editing
            ? 'Editar rol'
            : 'Nuevo rol'
      }
      open
      footer={null}
      onCancel={close}
      width={permissionsMode ? 900 : 520}
      destroyOnHidden
    >
      <Form
        layout="vertical"
        initialValues={initialValues}
        onFinish={(values) =>
          run(
            () =>
              permissionsMode
                ? mutations.permissions.mutateAsync({
                    role: state.role,
                    codes: values.permissionCodes,
                  })
                : editing
                  ? mutations.updateRole.mutateAsync({
                      role: state.role,
                      values,
                    })
                  : mutations.createRole.mutateAsync(values),
            refresh,
            permissionsMode
              ? 'Permisos actualizados.'
              : editing
                ? 'Rol actualizado.'
                : 'Rol creado.',
            close,
          )
        }
      >
        {permissionsMode ? (
          <Form.Item name="permissionCodes">
            <PermissionMatrix permissions={permissionCatalog} />
          </Form.Item>
        ) : (
          <>
            <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Descripción">
              <Input.TextArea />
            </Form.Item>
          </>
        )}
        <Button type="primary" htmlType="submit">
          Guardar
        </Button>
      </Form>
    </Modal>
  );
}
