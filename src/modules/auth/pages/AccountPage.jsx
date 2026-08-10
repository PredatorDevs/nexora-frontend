import { App, Alert, Button, Card, Form, Input, Space, Typography } from 'antd';
import { useState } from 'react';
import { useLocation } from 'react-router';
import { routes } from '@/app/routes.js';
import { useAuth } from '@/auth/useAuth.js';
import { PageHeader } from '@/components/ui/PageHeader.jsx';

export function AccountPage() {
  const { message } = App.useApp();
  const { user, updateProfile, changePassword } = useAuth();
  const forced = useLocation().pathname === routes.changePassword;
  const [pending, setPending] = useState(null);
  return (
    <>
      <PageHeader
        title={forced ? 'Cambia tu contraseña' : 'Mi perfil'}
        description={
          forced
            ? 'Debes reemplazar la contraseña temporal antes de continuar.'
            : 'Administra tu nombre y la seguridad de tu cuenta.'
        }
      />
      <Space orientation="vertical" size="large" className="full-width">
        {forced ? (
          <Alert
            type="warning"
            showIcon
            title="Cambio de contraseña obligatorio"
          />
        ) : (
          <Card title="Datos personales">
            <Form
              layout="vertical"
              initialValues={user}
              onFinish={async ({ displayName }) => {
                setPending('profile');
                try {
                  await updateProfile({ displayName });
                  message.success('Perfil actualizado.');
                } finally {
                  setPending(null);
                }
              }}
            >
              <Form.Item label="Correo electrónico" name="email">
                <Input disabled />
              </Form.Item>
              <Form.Item
                label="Nombre"
                name="displayName"
                rules={[{ required: true, max: 120 }]}
              >
                <Input autoComplete="name" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={pending === 'profile'}
              >
                Guardar perfil
              </Button>
            </Form>
          </Card>
        )}
        <Card title="Contraseña">
          <Typography.Paragraph type="secondary">
            Al cambiarla se cerrarán las demás sesiones de tu cuenta.
          </Typography.Paragraph>
          <Form
            layout="vertical"
            onFinish={async (values) => {
              setPending('password');
              try {
                await changePassword({
                  currentPassword: values.currentPassword,
                  newPassword: values.newPassword,
                });
                message.success('Contraseña actualizada.');
              } finally {
                setPending(null);
              }
            }}
          >
            <Form.Item
              label="Contraseña actual"
              name="currentPassword"
              rules={[{ required: true }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Form.Item
              label="Nueva contraseña"
              name="newPassword"
              rules={[{ required: true, min: 12 }]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              label="Confirmar nueva contraseña"
              name="confirmation"
              dependencies={['newPassword']}
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    return value === getFieldValue('newPassword')
                      ? Promise.resolve()
                      : Promise.reject(
                          new Error('Las contraseñas no coinciden.'),
                        );
                  },
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={pending === 'password'}
            >
              Cambiar contraseña
            </Button>
          </Form>
        </Card>
      </Space>
    </>
  );
}
