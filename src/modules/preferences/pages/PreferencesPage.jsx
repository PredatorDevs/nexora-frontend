import { UndoOutlined } from '@ant-design/icons';
import { Button, Card, Radio, Space, Switch, Typography } from 'antd';

import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { usePreferences } from '@/preferences/usePreferences.js';

const options = {
  themeMode: [
    { label: 'Sistema', value: 'system' },
    { label: 'Claro', value: 'light' },
    { label: 'Oscuro', value: 'dark' },
  ],
  density: [
    { label: 'Cómoda', value: 'comfortable' },
    { label: 'Compacta', value: 'compact' },
  ],
};

function PreferenceRow({ title, description, children }) {
  return (
    <Space orientation="vertical" size={8} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 2 }}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary">{description}</Typography.Text>
      </div>
      {children}
    </Space>
  );
}

export function PreferencesPage() {
  const { preferences, resetPreferences, resolvedTheme, updatePreferences } =
    usePreferences();

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        eyebrow="Cuenta"
        title="Apariencia y accesibilidad"
        description="Ajusta la interfaz en este navegador. Los cambios se aplican inmediatamente."
        extra={
          <Button icon={<UndoOutlined />} onClick={resetPreferences}>
            Restablecer
          </Button>
        }
      />

      <Card title="Apariencia">
        <Space orientation="vertical" size={28} style={{ width: '100%' }}>
          <PreferenceRow
            title="Tema"
            description={`Tema activo: ${resolvedTheme === 'dark' ? 'oscuro' : 'claro'}.`}
          >
            <Radio.Group
              aria-label="Tema de color"
              optionType="button"
              options={options.themeMode}
              value={preferences.themeMode}
              onChange={(event) =>
                updatePreferences({ themeMode: event.target.value })
              }
            />
          </PreferenceRow>
          <PreferenceRow
            title="Densidad"
            description="Reduce el espacio entre controles y filas cuando necesitas ver más información."
          >
            <Radio.Group
              aria-label="Densidad de la interfaz"
              optionType="button"
              options={options.density}
              value={preferences.density}
              onChange={(event) =>
                updatePreferences({ density: event.target.value })
              }
            />
          </PreferenceRow>
        </Space>
      </Card>

      <Card title="Accesibilidad">
        <Space orientation="vertical" size={28} style={{ width: '100%' }}>
          <PreferenceRow
            title="Contraste reforzado"
            description="Aumenta el contraste del texto, los bordes y los controles interactivos."
          >
            <Switch
              aria-label="Contraste reforzado"
              checked={preferences.highContrast}
              checkedChildren="Activado"
              unCheckedChildren="Desactivado"
              onChange={(checked) =>
                updatePreferences({ highContrast: checked })
              }
            />
          </PreferenceRow>
          <PreferenceRow
            title="Reducir movimiento"
            description="Desactiva animaciones y transiciones no esenciales. La preferencia del sistema también se respeta automáticamente."
          >
            <Switch
              aria-label="Reducir movimiento"
              checked={preferences.reduceMotion}
              checkedChildren="Activado"
              unCheckedChildren="Desactivado"
              onChange={(checked) =>
                updatePreferences({ reduceMotion: checked })
              }
            />
          </PreferenceRow>
        </Space>
      </Card>
    </Space>
  );
}
