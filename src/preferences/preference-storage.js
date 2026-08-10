export const PREFERENCE_STORAGE_KEY = 'nexora.ui-preferences.v1';

export const defaultPreferences = Object.freeze({
  themeMode: 'system',
  density: 'comfortable',
  highContrast: false,
  reduceMotion: false,
});

const allowedThemeModes = new Set(['system', 'light', 'dark']);
const allowedDensities = new Set(['comfortable', 'compact']);

export function normalizePreferences(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...defaultPreferences };
  }
  return {
    themeMode: allowedThemeModes.has(value.themeMode)
      ? value.themeMode
      : defaultPreferences.themeMode,
    density: allowedDensities.has(value.density)
      ? value.density
      : defaultPreferences.density,
    highContrast:
      typeof value.highContrast === 'boolean'
        ? value.highContrast
        : defaultPreferences.highContrast,
    reduceMotion:
      typeof value.reduceMotion === 'boolean'
        ? value.reduceMotion
        : defaultPreferences.reduceMotion,
  };
}

export function readPreferences(storage = globalThis.localStorage) {
  try {
    const stored = storage?.getItem(PREFERENCE_STORAGE_KEY);
    return stored
      ? normalizePreferences(JSON.parse(stored))
      : { ...defaultPreferences };
  } catch {
    return { ...defaultPreferences };
  }
}

export function writePreferences(
  preferences,
  storage = globalThis.localStorage,
) {
  try {
    storage?.setItem(
      PREFERENCE_STORAGE_KEY,
      JSON.stringify(normalizePreferences(preferences)),
    );
  } catch {
    // La interfaz sigue funcionando si el navegador bloquea el almacenamiento.
  }
}

export function resolveTheme(themeMode, systemPrefersDark) {
  return themeMode === 'system'
    ? systemPrefersDark
      ? 'dark'
      : 'light'
    : themeMode;
}

export function applyPreferenceAttributes(preferences, systemPrefersDark) {
  const normalized = normalizePreferences(preferences);
  const root = document.documentElement;
  const resolvedTheme = resolveTheme(
    normalized.themeMode,
    systemPrefersDark ??
      globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches,
  );

  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = normalized.themeMode;
  root.dataset.density = normalized.density;
  root.dataset.highContrast = String(normalized.highContrast);
  root.dataset.reduceMotion = String(normalized.reduceMotion);
  root.style.colorScheme = resolvedTheme;
  return resolvedTheme;
}
