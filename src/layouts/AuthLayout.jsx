import { LockOutlined } from '@ant-design/icons';
import { Outlet } from 'react-router';

import styles from '@/layouts/AuthLayout.module.css';
import { environment } from '@/config/environment.js';

export function AuthLayout() {
  return (
    <main className={styles.layout}>
      <section className={styles.brandPanel} aria-label={environment.appName}>
        <div className={styles.brandContent}>
          <span className={styles.brandIcon} aria-hidden="true">
            <LockOutlined />
          </span>
          <p className={styles.eyebrow}>Administración segura</p>
          <h1>{environment.appName}</h1>
          <p>
            Acceso protegido por sesiones renovables y permisos efectivos del
            backend.
          </p>
        </div>
      </section>
      <section className={styles.formPanel}>
        <Outlet />
      </section>
    </main>
  );
}
