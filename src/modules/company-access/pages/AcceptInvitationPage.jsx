import { Alert, Button, Card, Form, Input, Result, Spin, Typography } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { routes } from '@/app/routes.js';
import * as api from '@/modules/company-access/invitations.api.js';

export function AcceptInvitationPage() {
  const [parameters] = useSearchParams();
  const token = parameters.get('token') ?? '';
  const invitation = useQuery({ queryKey: ['invitation', token], queryFn: () => api.previewInvitation(token), enabled: Boolean(token), retry: false });
  const acceptance = useMutation({ mutationFn: (values) => api.acceptInvitation(token, values) });
  if (!token) return <Result status="error" title="InvitaciÃ³n no vÃ¡lida" />;
  if (invitation.isLoading) return <Spin />;
  if (invitation.error) return <Result status="error" title="InvitaciÃ³n no disponible" subTitle={invitation.error.message} />;
  if (acceptance.isSuccess) return <Result status="success" title="InvitaciÃ³n aceptada" subTitle="Ya puedes iniciar sesiÃ³n y operar en la empresa." extra={<Link to={routes.login}>Ir al inicio de sesiÃ³n</Link>} />;
  const value = invitation.data;
  return (
    <Card title={`InvitaciÃ³n a ${value.company.commercialName || value.company.legalName}`} style={{ width: '100%', maxWidth: 520 }}>
      <Typography.Paragraph>La invitaciÃ³n corresponde a {value.email}.</Typography.Paragraph>
      {acceptance.error ? <Alert type="error" showIcon message={acceptance.error.message} style={{ marginBottom: 16 }} /> : null}
      <Form layout="vertical" onFinish={(values) => acceptance.mutate(values)}>
        {value.requiresAccountCreation ? (
          <>
            <Form.Item name="displayName" label="Nombre" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="password" label="ContraseÃ±a" rules={[{ required: true, min: 12 }]}><Input.Password /></Form.Item>
          </>
        ) : (
          <Alert type="info" showIcon message="Ya existe una cuenta para este correo. Al aceptar se agregarÃ¡ el acceso empresarial." style={{ marginBottom: 16 }} />
        )}
        <Button type="primary" htmlType="submit" loading={acceptance.isPending}>Aceptar invitaciÃ³n</Button>
      </Form>
    </Card>
  );
}
