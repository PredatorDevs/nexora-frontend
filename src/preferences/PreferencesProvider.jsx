import { useEffect, useMemo, useState } from 'react';

import {
  applyPreferenceAttributes,
  defaultPreferences,
  readPreferences,
  resolveTheme,
  writePreferences,
} from '@/preferences/preference-storage.js';
import { PreferencesContext } from '@/preferences/preferences-context.js';

const darkSchemeQuery = '(prefers-color-scheme: dark)';
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

export function PreferencesProvider({ children }) {
  const [preferences, setPreferencesState] = useState(readPreferences);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => globalThis.matchMedia?.(darkSchemeQuery).matches ?? false,
  );
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] = useState(
    () => globalThis.matchMedia?.(reducedMotionQuery).matches ?? false,
  );

  useEffect(() => {
    const media = globalThis.matchMedia?.(darkSchemeQuery);
    if (!media) return undefined;
    const handleChange = (event) => setSystemPrefersDark(event.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const media = globalThis.matchMedia?.(reducedMotionQuery);
    if (!media) return undefined;
    const handleChange = (event) =>
      setSystemPrefersReducedMotion(event.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    writePreferences(preferences);
    applyPreferenceAttributes(preferences, systemPrefersDark);
  }, [preferences, systemPrefersDark]);

  const value = useMemo(
    () => ({
      preferences,
      resolvedTheme: resolveTheme(preferences.themeMode, systemPrefersDark),
      resolvedReduceMotion:
        preferences.reduceMotion || systemPrefersReducedMotion,
      updatePreferences: (updates) =>
        setPreferencesState((current) => ({ ...current, ...updates })),
      resetPreferences: () => setPreferencesState({ ...defaultPreferences }),
    }),
    [preferences, systemPrefersDark, systemPrefersReducedMotion],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
