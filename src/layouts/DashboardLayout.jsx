import { Grid, Layout } from 'antd';
import { useState } from 'react';
import { Outlet } from 'react-router';

import { AppHeader } from '@/layouts/components/AppHeader.jsx';
import { AppSidebar } from '@/layouts/components/AppSidebar.jsx';
import { Breadcrumbs } from '@/layouts/components/Breadcrumbs.jsx';
import { MobileNavigation } from '@/layouts/components/MobileNavigation.jsx';
import styles from '@/layouts/DashboardLayout.module.css';

export function DashboardLayout() {
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.lg);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  function toggleNavigation() {
    if (isDesktop) setCollapsed((value) => !value);
    else setMobileNavigationOpen(true);
  }

  return (
    <Layout className={styles.root} hasSider={isDesktop}>
      {isDesktop ? <AppSidebar collapsed={collapsed} /> : null}
      <MobileNavigation
        onClose={() => setMobileNavigationOpen(false)}
        open={!isDesktop && mobileNavigationOpen}
      />
      <Layout>
        <AppHeader
          collapsed={collapsed}
          isDesktop={isDesktop}
          onNavigationToggle={toggleNavigation}
        />
        <Layout.Content className={styles.content}>
          <div className={styles.breadcrumbs}>
            <Breadcrumbs />
          </div>
          <div className={styles.pageContent}>
            <Outlet />
          </div>
        </Layout.Content>
        <Layout.Footer className={styles.footer}>
          Predator Frontend Boilerplate
        </Layout.Footer>
      </Layout>
    </Layout>
  );
}
