import { Drawer } from 'antd';

import { NavigationMenu } from '@/layouts/components/NavigationMenu.jsx';

export function MobileNavigation({ open, onClose }) {
  return (
    <Drawer
      aria-label="Navegación principal"
      closable
      onClose={onClose}
      open={open}
      placement="left"
      size={280}
      styles={{ body: { padding: 0 } }}
      title="Nexora ERP"
    >
      <nav aria-label="Navegación principal móvil">
        <NavigationMenu onNavigate={onClose} />
      </nav>
    </Drawer>
  );
}
