import { Layout } from 'antd';

import { NavigationMenu } from '@/layouts/components/NavigationMenu.jsx';
import styles from '@/layouts/DashboardLayout.module.css';

export function AppSidebar({ collapsed }) {
  return (
    <Layout.Sider
      className={styles.sidebar}
      collapsed={collapsed}
      collapsedWidth={80}
      theme="dark"
      width={248}
    >
      <div className={styles.sidebarBrand} aria-label="Nexora ERP">
        <span className={styles.brandMark} aria-hidden="true">
          P
        </span>
        {!collapsed && <span className={styles.brandName}>Nexora ERP</span>}
      </div>
      <nav aria-label="Navegación principal">
        <NavigationMenu theme="dark" />
      </nav>
    </Layout.Sider>
  );
}
