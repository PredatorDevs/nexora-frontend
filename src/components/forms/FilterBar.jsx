import { Flex } from 'antd';

import styles from '@/components/shared.module.css';

export function FilterBar({ children, actions }) {
  return (
    <Flex
      className={styles.filterBar}
      align="center"
      gap="small"
      justify="space-between"
      wrap
    >
      <Flex align="center" gap="small" wrap>
        {children}
      </Flex>
      {actions ? (
        <Flex gap="small" wrap>
          {actions}
        </Flex>
      ) : null}
    </Flex>
  );
}
