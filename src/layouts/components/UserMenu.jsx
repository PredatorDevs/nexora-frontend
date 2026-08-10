import {
  LogoutOutlined,
  PoweroffOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { App, Avatar, Button, Dropdown, Space, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useAuth } from '@/auth/useAuth.js';
import styles from '@/layouts/DashboardLayout.module.css';

function initials(displayName) {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function UserMenu() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { logout, logoutAll, user } = useAuth();
  const [isClosingSession, setIsClosingSession] = useState(false);

  async function closeSession(operation) {
    setIsClosingSession(true);
    try {
      await operation();
    } catch {
      message.warning(
        'La sesión se cerró localmente, pero el servidor no respondió.',
      );
    } finally {
      setIsClosingSession(false);
    }
  }

  function selectItem({ key }) {
    if (key === 'profile') navigate('/profile');
    if (key === 'logout') void closeSession(logout);
    if (key === 'logout-all') {
      modal.confirm({
        title: 'Cerrar todas las sesiones',
        content: 'Se revocarán las sesiones activas de todos tus dispositivos.',
        okText: 'Cerrar todas',
        okButtonProps: { danger: true },
        cancelText: 'Cancelar',
        onOk: () => closeSession(logoutAll),
      });
    }
  }

  const items = [
    {
      key: 'identity',
      disabled: true,
      label: (
        <div className={styles.identity}>
          <Typography.Text strong>{user.displayName}</Typography.Text>
          <Typography.Text type="secondary">{user.email}</Typography.Text>
        </div>
      ),
    },
    { type: 'divider' },
    { key: 'profile', icon: <UserOutlined />, label: 'Mi perfil' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar sesión' },
    {
      key: 'logout-all',
      danger: true,
      icon: <PoweroffOutlined />,
      label: 'Cerrar todas las sesiones',
    },
  ];

  return (
    <Dropdown
      menu={{ items, onClick: selectItem }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button
        aria-label="Abrir menú de usuario"
        className={styles.userButton}
        loading={isClosingSession}
        type="text"
      >
        <Space>
          <Avatar icon={!initials(user.displayName) && <UserOutlined />}>
            {initials(user.displayName)}
          </Avatar>
          <span className={styles.userName}>{user.displayName}</span>
        </Space>
      </Button>
    </Dropdown>
  );
}
