import { Button, Empty } from 'antd';

import styles from '@/components/shared.module.css';

export function EmptyState({
  title = 'No hay resultados',
  description,
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <div className={compact ? styles.compactState : styles.state}>
      <Empty
        description={
          <>
            <strong>{title}</strong>
            {description ? (
              <span className={styles.emptyDescription}>{description}</span>
            ) : null}
          </>
        }
      >
        {actionLabel && onAction ? (
          <Button onClick={onAction}>{actionLabel}</Button>
        ) : null}
      </Empty>
    </div>
  );
}
