import { useContext } from 'react';

import { PreferencesContext } from '@/preferences/preferences-context.js';

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error(
      'usePreferences debe usarse dentro de PreferencesProvider.',
    );
  }
  return context;
}
