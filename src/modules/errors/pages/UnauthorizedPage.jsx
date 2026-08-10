import { Button, Result, Typography } from 'antd';
import { Link } from 'react-router';

import { routes } from '@/app/routes.js';

export function UnauthorizedPage() {
  return (
    <div>
      <Result
        status="403"
        title={<Typography.Title level={1}>403</Typography.Title>}
        subTitle="No tienes permiso para acceder a esta página."
        extra={
          <Button type="primary">
            <Link to={routes.home}>Volver al inicio</Link>
          </Button>
        }
      />
    </div>
  );
}
