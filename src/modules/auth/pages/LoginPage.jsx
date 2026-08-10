import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd';
import { Controller, useForm } from 'react-hook-form';

import { useAuth } from '@/auth/useAuth.js';
import { loginSchema } from '@/modules/auth/auth.schemas.js';

const loginErrorMessages = Object.freeze({
  INVALID_CREDENTIALS: 'El correo o la contraseña no son válidos.',
  RATE_LIMIT_EXCEEDED:
    'Se realizaron demasiados intentos. Espera un momento e inténtalo nuevamente.',
  NETWORK_ERROR: 'No fue posible conectar con el servidor.',
  REQUEST_TIMEOUT: 'El servidor tardó demasiado en responder.',
});

function loginErrorMessage(error) {
  return (
    loginErrorMessages[error?.code] ??
    'No fue posible iniciar sesión. Inténtalo nuevamente.'
  );
}

export function LoginPage() {
  const { login, initializationError } = useAuth();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function submit(credentials) {
    try {
      await login(credentials);
    } catch (error) {
      setError('root', { type: 'server', message: loginErrorMessage(error) });
    }
  }

  return (
    <Card className="login-card" variant="borderless">
      <Space orientation="vertical" size="large" className="full-width">
        <div>
          <Typography.Title level={2}>Iniciar sesión</Typography.Title>
          <Typography.Text type="secondary">
            Ingresa tus credenciales administrativas para continuar.
          </Typography.Text>
        </div>

        {initializationError && (
          <Alert
            type="warning"
            showIcon
            title="No fue posible recuperar la sesión anterior."
          />
        )}

        {errors.root && (
          <Alert type="error" showIcon title={errors.root.message} />
        )}

        <Form
          layout="vertical"
          onFinish={handleSubmit(submit)}
          requiredMark={false}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Form.Item
                label="Correo electrónico"
                htmlFor="login-email"
                validateStatus={errors.email ? 'error' : undefined}
                help={errors.email?.message}
              >
                <Input
                  {...field}
                  autoComplete="email"
                  id="login-email"
                  inputMode="email"
                  size="large"
                  placeholder="usuario@ejemplo.com"
                />
              </Form.Item>
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Form.Item
                label="Contraseña"
                htmlFor="login-password"
                validateStatus={errors.password ? 'error' : undefined}
                help={errors.password?.message}
              >
                <Input.Password
                  {...field}
                  autoComplete="current-password"
                  id="login-password"
                  size="large"
                  placeholder="Ingresa tu contraseña"
                />
              </Form.Item>
            )}
          />

          <Button
            block
            htmlType="submit"
            loading={isSubmitting}
            size="large"
            type="primary"
          >
            Iniciar sesión
          </Button>
        </Form>
      </Space>
    </Card>
  );
}
