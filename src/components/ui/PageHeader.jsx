import { Flex, Space, Typography } from 'antd';

import styles from '@/components/shared.module.css';

export function PageHeader({ title, description, eyebrow, extra }) {
  return (
    <Flex
      className={styles.pageHeader}
      align="flex-start"
      justify="space-between"
      gap="middle"
      wrap
    >
      <div>
        {eyebrow ? (
          <Typography.Text type="secondary">{eyebrow}</Typography.Text>
        ) : null}
        <Typography.Title className={styles.pageTitle} level={1}>
          {title}
        </Typography.Title>
        {description ? (
          <Typography.Paragraph
            className={styles.pageDescription}
            type="secondary"
          >
            {description}
          </Typography.Paragraph>
        ) : null}
      </div>
      {extra ? <Space wrap>{extra}</Space> : null}
    </Flex>
  );
}
