import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Layout, Typography } from 'antd';

import { ThemeSwitch } from '@/components/preferences/ThemeSwitch.jsx';
import { environment } from '@/config/environment.js';
import { UserMenu } from '@/layouts/components/UserMenu.jsx';
import { CompanySwitcher } from '@/layouts/components/CompanySwitcher.jsx';
import styles from '@/layouts/DashboardLayout.module.css';

export function AppHeader({ collapsed, isDesktop, onNavigationToggle }) {
  const navigationLabel = isDesktop
    ? collapsed
      ? 'Expandir navegación'
      : 'Contraer navegación'
    : 'Abrir navegación';

  return (
    <Layout.Header className={styles.header}>
      <div className={styles.headerStart}>
        <Button
          aria-label={navigationLabel}
          icon={
            collapsed && isDesktop ? (
              <MenuUnfoldOutlined />
            ) : (
              <MenuFoldOutlined />
            )
          }
          onClick={onNavigationToggle}
          type="text"
        />
        <Typography.Text className={styles.mobileBrand} strong>
          {environment.appName}
        </Typography.Text>
      </div>
      <div className={styles.headerActions}>
        <CompanySwitcher />
        <ThemeSwitch />
        <UserMenu />
      </div>
    </Layout.Header>
  );
}
