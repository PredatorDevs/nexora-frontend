import { Alert, Button, Space, Typography } from 'antd';

import styles from '@/components/shared.module.css';

const messages = Object.freeze({
  NETWORK_ERROR: 'No fue posible conectar con el servidor.',
  REQUEST_TIMEOUT: 'El servidor tardó demasiado en responder.',
  FORBIDDEN: 'No tienes permiso para realizar esta operación.',
});

export function ErrorState({ error, onRetry, compact = false }) {
  const message =
    messages[error?.code] ??
    error?.message ??
    'No fue posible completar la operación.';
  return (
    <div className={compact ? styles.compactState : styles.state} role="alert">
      <Alert
        type="error"
        showIcon
        title={message}
        description={
          <Space orientation="vertical" size="small">
            {error?.requestId ? (
              <Typography.Text type="secondary">
                Código de seguimiento: {error.requestId}
              </Typography.Text>
            ) : null}
            {onRetry ? <Button onClick={onRetry}>Reintentar</Button> : null}
          </Space>
        }
      />
    </div>
  );
}
