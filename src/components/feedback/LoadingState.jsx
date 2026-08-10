import { Flex, Skeleton, Spin, Typography } from 'antd';

import styles from '@/components/shared.module.css';

export function LoadingState({ message = 'Cargando…', rows = 0 }) {
  return (
    <div className={styles.state} aria-busy="true" aria-live="polite">
      {rows > 0 ? (
        <Skeleton active paragraph={{ rows }} title={false} />
      ) : (
        <Flex vertical align="center" gap="small">
          <Spin />
          <Typography.Text type="secondary">{message}</Typography.Text>
        </Flex>
      )}
    </div>
  );
}
