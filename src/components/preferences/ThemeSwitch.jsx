import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';

import { usePreferences } from '@/preferences/usePreferences.js';

export function ThemeSwitch({ className }) {
  const { resolvedTheme, updatePreferences } = usePreferences();
  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';

  return (
    <Tooltip title={label}>
      <Switch
        aria-label={label}
        checked={isDark}
        checkedChildren={
          <MoonOutlined aria-hidden="true" style={{ color: '#ffffff' }} />
        }
        className={className}
        unCheckedChildren={
          <SunOutlined aria-hidden="true" style={{ color: '#fadb14' }} />
        }
        onChange={(checked) =>
          updatePreferences({ themeMode: checked ? 'dark' : 'light' })
        }
      />
    </Tooltip>
  );
}
