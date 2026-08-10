import { Button, Result, Typography } from 'antd';
import { Link } from 'react-router';

import { routes } from '@/app/routes.js';

export function NotFoundPage() {
  return (
    <main className="app-shell">
      <Result
        status="404"
        title={<Typography.Title level={1}>404</Typography.Title>}
        subTitle="La página que buscas no existe."
        extra={
          <Button type="primary">
            <Link to={routes.home}>Volver al inicio</Link>
          </Button>
        }
      />
    </main>
  );
}
