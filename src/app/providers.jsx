import { QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';

import { queryClient } from '@/app/query-client.js';
import { AuthProvider } from '@/auth/AuthProvider.jsx';

const theme = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8,
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
};

export function AppProviders({ children, authProviderProps }) {
  return (
    <ConfigProvider locale={esES} theme={theme}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <AuthProvider {...authProviderProps}>{children}</AuthProvider>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}
