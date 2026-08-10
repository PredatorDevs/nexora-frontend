import {
  App,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Typography,
} from 'antd';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from '@/auth/useAuth.js';
import { Can } from '@/components/authorization/Can.jsx';
import { ErrorState } from '@/components/feedback/ErrorState.jsx';
import { LoadingState } from '@/components/feedback/LoadingState.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { permissions } from '@/config/permissions.js';
import { routes } from '@/app/routes.js';
import {
  useRoleOptions,
  useUser,
  useUserMutations,
} from '@/modules/users/hooks/useUsers.js';
export function UserDetailsPage() {
  const { id } = useParams();
  const { user: currentUser, hasPermission } = useAuth();
  const { message } = App.useApp();
  const query = useUser(id);
  const canLoadRoles =
    hasPermission(permissions.users.assignRoles) &&
    hasPermission(permissions.roles.read);
  const roles = useRoleOptions(canLoadRoles);
  const { replaceRoles, resetPassword } = useUserMutations();
  const [roleIds, setRoleIds] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetForm] = Form.useForm();
  if (query.isLoading) return <LoadingState />;
  if (query.error)
    return <ErrorState error={query.error} onRetry={query.refetch} />;
  const user = query.data;
  const selected = roleIds ?? user.roles.map(({ role }) => role.id);
  return (
    <>
      <PageHeader
        title={user.displayName}
        description={user.email}
        extra={
          <Can permission={permissions.users.update}>
            <Button>
              <Link to={`${routes.users}/${id}/edit`}>Editar</Link>
            </Button>
          </Can>
        }
      />
      <Space orientation="vertical" size="large" className="full-width">
        <Card>
          <Descriptions
            column={{ xs: 1, md: 2 }}
            items={[
              {
                key: 'status',
                label: 'Estado',
                children: <StatusBadge status={user.status} />,
              },
              { key: 'id', label: 'ID', children: user.id },
              {
                key: 'created',
                label: 'Creado',
                children: new Intl.DateTimeFormat('es', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(user.createdAt)),
              },
              {
                key: 'updated',
                label: 'Actualizado',
                children: new Intl.DateTimeFormat('es', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(user.updatedAt)),
              },
            ]}
          />
        </Card>
        <Can permission={permissions.users.resetPassword}>
          <Card title="Seguridad">
            <Typography.Paragraph type="secondary">
              El reset revoca todas las sesiones activas del usuario.
            </Typography.Paragraph>
            <Button
              danger
              disabled={currentUser.id === user.id}
              title={
                currentUser.id === user.id
                  ? 'Usa Mi perfil para cambiar tu propia contraseña.'
                  : undefined
              }
              onClick={() => setResetOpen(true)}
            >
              Restablecer contraseña
            </Button>
          </Card>
          <Modal
            title="Restablecer contraseña"
            open={resetOpen}
            confirmLoading={resetPassword.isPending}
            onCancel={() => setResetOpen(false)}
            onOk={() => resetForm.submit()}
          >
            <Form
              form={resetForm}
              layout="vertical"
              initialValues={{ mustChangePassword: true }}
              onFinish={async (data) => {
                try {
                  await resetPassword.mutateAsync({
                    id: user.id,
                    data: { ...data, expectedUpdatedAt: user.updatedAt },
                  });
                  message.success(
                    'Contraseña restablecida y sesiones revocadas.',
                  );
                  setResetOpen(false);
                  resetForm.resetFields();
                } catch (error) {
                  message.error(error.message);
                }
              }}
            >
              <Form.Item
                name="password"
                label="Contraseña temporal"
                rules={[{ required: true, min: 12 }]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Form.Item name="mustChangePassword" valuePropName="checked">
                <Checkbox>Exigir cambio en el próximo acceso</Checkbox>
              </Form.Item>
            </Form>
          </Modal>
        </Can>
        <Can allOf={[permissions.users.assignRoles, permissions.roles.read]}>
          <Card title="Roles">
            <Typography.Paragraph type="secondary">
              Los cambios reemplazan la asignación completa.
            </Typography.Paragraph>
            <Space orientation="vertical" className="full-width">
              <Select
                mode="multiple"
                loading={roles.isLoading}
                value={selected}
                onChange={setRoleIds}
                options={(roles.data ?? []).map((role) => ({
                  value: role.id,
                  label: `${role.name} (${role.code})`,
                }))}
              />
              <Button
                type="primary"
                disabled={currentUser.id === user.id || roleIds === null}
                loading={replaceRoles.isPending}
                onClick={async () => {
                  try {
                    await replaceRoles.mutateAsync({
                      id: user.id,
                      roleIds: selected,
                      expectedUpdatedAt: user.updatedAt,
                    });
                    message.success('Roles actualizados.');
                    setRoleIds(null);
                  } catch (error) {
                    message.error(error.message);
                  }
                }}
              >
                Guardar roles
              </Button>
              {currentUser.id === user.id ? (
                <Typography.Text type="secondary">
                  No puedes modificar tus propios roles.
                </Typography.Text>
              ) : null}
            </Space>
          </Card>
        </Can>
      </Space>
    </>
  );
}
