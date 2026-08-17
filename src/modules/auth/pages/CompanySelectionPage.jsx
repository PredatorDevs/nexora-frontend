import { BankOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Row, Space, Typography } from 'antd';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';

import { routes } from '@/app/routes.js';
import { useAuth } from '@/auth/useAuth.js';
import { PageHeader } from '@/components/ui/PageHeader.jsx';

export function CompanySelectionPage() {
  const { memberships, activeMembership, switchCompany } = useAuth();
  const [switchingId, setSwitchingId] = useState(null);
  const { message } = App.useApp();
  const navigate = useNavigate();

  if (activeMembership) return <Navigate to={routes.home} replace />;

  async function select(companyId) {
    setSwitchingId(companyId);
    try {
      await switchCompany(companyId);
      navigate(routes.home, { replace: true });
    } catch (error) {
      message.error(error.message);
    } finally {
      setSwitchingId(null);
    }
  }

  return (
    <>
      <PageHeader title="Selecciona una empresa" description="Elige el espacio de trabajo que deseas utilizar en esta sesión." />
      <Row gutter={[16, 16]}>
        {memberships.map(({ company }) => (
          <Col xs={24} md={12} xl={8} key={company.id}>
            <Card>
              <Space orientation="vertical" size="middle" className="full-width">
                <Space><BankOutlined /><Typography.Title level={4} style={{ margin: 0 }}>{company.commercialName || company.legalName}</Typography.Title></Space>
                <Typography.Text type="secondary">{company.legalName}</Typography.Text>
                <Typography.Text code>{company.code}</Typography.Text>
                <Button type="primary" block loading={switchingId === company.id} onClick={() => select(company.id)}>Ingresar</Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
