import { CheckCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Space, Tag, Typography } from 'antd';
import { Link } from 'react-router';

import { useAuth } from '@/auth/useAuth.js';
import { routes } from '@/app/routes.js';
import { Can } from '@/components/authorization/Can.jsx';
import { permissions } from '@/config/permissions.js';
import { environment } from '@/config/environment.js';
import styles from '@/modules/home/pages/HomePage.module.css';

const { Paragraph, Text, Title } = Typography;

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <Card className={styles.welcomeCard} variant="borderless">
        <Space orientation="vertical" size="large">
          <Flex align="center" gap="small" wrap>
            <Tag color="blue" icon={<RocketOutlined />}>
              Boilerplate operativo
            </Tag>
            <Text type="secondary">Consola administrativa</Text>
          </Flex>

          <div>
            <Title>{environment.appName}</Title>
            <Paragraph className={styles.welcomeCopy}>
              Boilerplate administrativo preparado para integrar autenticación,
              permisos y módulos reutilizables sobre React y Ant Design.
            </Paragraph>
            <Text type="secondary">
              Sesión iniciada como {user.displayName} ({user.email})
            </Text>
          </div>

          <Space orientation="vertical">
            <Text>
              <CheckCircleOutlined className={styles.successIcon} /> Router
              configurado
            </Text>
            <Text>
              <CheckCircleOutlined className={styles.successIcon} /> Providers
              activos
            </Text>
            <Text>
              <CheckCircleOutlined className={styles.successIcon} /> API base:{' '}
              <Text code>{environment.apiBaseUrl}</Text>
            </Text>
            <Can permission={permissions.users.read}>
              <Text>
                <CheckCircleOutlined className={styles.successIcon} />
                Administración de usuarios disponible
              </Text>
            </Can>
          </Space>

          <Button type="primary">
            <Link to={routes.notFound}>Ver página 404</Link>
          </Button>
        </Space>
      </Card>
    </div>
  );
}
