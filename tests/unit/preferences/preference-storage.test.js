import { afterEach, describe, expect, it } from 'vitest';

import {
  applyPreferenceAttributes,
  defaultPreferences,
  normalizePreferences,
  PREFERENCE_STORAGE_KEY,
  readPreferences,
  resolveTheme,
  writePreferences,
} from '@/preferences/preference-storage.js';

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-density');
  document.documentElement.removeAttribute('data-high-contrast');
  document.documentElement.removeAttribute('data-reduce-motion');
});

describe('preference storage', () => {
  it('descarta valores inválidos sin perder preferencias válidas', () => {
    expect(
      normalizePreferences({
        themeMode: 'sepia',
        density: 'compact',
        highContrast: true,
        reduceMotion: 'yes',
      }),
    ).toEqual({
      themeMode: 'system',
      density: 'compact',
      highContrast: true,
      reduceMotion: false,
    });
  });

  it('tolera almacenamiento corrupto o no disponible', () => {
    localStorage.setItem(PREFERENCE_STORAGE_KEY, '{invalid');
    expect(readPreferences()).toEqual(defaultPreferences);
    expect(
      readPreferences({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toEqual(defaultPreferences);
  });

  it('persiste y recupera la configuración normalizada', () => {
    const preferences = {
      themeMode: 'dark',
      density: 'compact',
      highContrast: true,
      reduceMotion: true,
    };
    writePreferences(preferences);
    expect(readPreferences()).toEqual(preferences);
  });

  it('resuelve el tema del sistema y aplica atributos al documento', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');

    applyPreferenceAttributes(
      {
        themeMode: 'system',
        density: 'compact',
        highContrast: true,
        reduceMotion: true,
      },
      true,
    );
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).toHaveAttribute('data-density', 'compact');
    expect(document.documentElement).toHaveAttribute(
      'data-high-contrast',
      'true',
    );
    expect(document.documentElement).toHaveAttribute(
      'data-reduce-motion',
      'true',
    );
  });
});
