import { QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider, theme as antTheme } from 'antd';
import esES from 'antd/locale/es_ES';

import { queryClient } from '@/app/query-client.js';
import { AuthProvider } from '@/auth/AuthProvider.jsx';
import { PreferencesProvider } from '@/preferences/PreferencesProvider.jsx';
import { usePreferences } from '@/preferences/usePreferences.js';

const fontFamily =
  "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function ThemedProviders({ children, authProviderProps }) {
  const { preferences, resolvedReduceMotion, resolvedTheme } = usePreferences();
  const algorithms = [
    resolvedTheme === 'dark'
      ? antTheme.darkAlgorithm
      : antTheme.defaultAlgorithm,
  ];
  if (preferences.density === 'compact')
    algorithms.push(antTheme.compactAlgorithm);

  const theme = {
    algorithm: algorithms,
    token: {
      colorPrimary: preferences.highContrast ? '#0050b3' : '#1677ff',
      borderRadius: 8,
      fontFamily,
      motion: !resolvedReduceMotion,
      ...(preferences.highContrast
        ? {
            colorText: resolvedTheme === 'dark' ? '#ffffff' : '#111111',
            colorTextSecondary:
              resolvedTheme === 'dark' ? '#f0f0f0' : '#333333',
            lineWidth: 2,
          }
        : {}),
    },
  };

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

export function AppProviders({ children, authProviderProps }) {
  return (
    <PreferencesProvider>
      <ThemedProviders authProviderProps={authProviderProps}>
        {children}
      </ThemedProviders>
    </PreferencesProvider>
  );
}
