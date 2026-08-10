import { Flex, Spin, Typography } from 'antd';

export function SessionLoading() {
  return (
    <main className="app-shell" aria-live="polite">
      <Flex vertical align="center" gap="middle">
        <Spin size="large" />
        <Typography.Text type="secondary">
          Recuperando tu sesión…
        </Typography.Text>
      </Flex>
    </main>
  );
}
