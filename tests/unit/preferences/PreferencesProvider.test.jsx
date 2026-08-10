import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { PreferencesPage } from '@/modules/preferences/pages/PreferencesPage.jsx';
import { PREFERENCE_STORAGE_KEY } from '@/preferences/preference-storage.js';
import { PreferencesProvider } from '@/preferences/PreferencesProvider.jsx';

describe('PreferencesProvider', () => {
  beforeEach(() => localStorage.clear());

  it('aplica y persiste las preferencias elegidas', async () => {
    const actor = userEvent.setup();
    render(
      <PreferencesProvider>
        <PreferencesPage />
      </PreferencesProvider>,
    );

    await actor.click(screen.getByText('Oscuro'));
    await actor.click(screen.getByText('Compacta'));
    await actor.click(
      screen.getByRole('switch', { name: 'Contraste reforzado' }),
    );
    await actor.click(
      screen.getByRole('switch', { name: 'Reducir movimiento' }),
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      expect(document.documentElement).toHaveAttribute(
        'data-density',
        'compact',
      );
      expect(
        JSON.parse(localStorage.getItem(PREFERENCE_STORAGE_KEY)),
      ).toMatchObject({
        themeMode: 'dark',
        density: 'compact',
        highContrast: true,
        reduceMotion: true,
      });
    });
  });

  it('restablece la configuración predeterminada', async () => {
    localStorage.setItem(
      PREFERENCE_STORAGE_KEY,
      JSON.stringify({ themeMode: 'dark', density: 'compact' }),
    );
    const actor = userEvent.setup();
    render(
      <PreferencesProvider>
        <PreferencesPage />
      </PreferencesProvider>,
    );

    await actor.click(screen.getByRole('button', { name: /restablecer/i }));
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(PREFERENCE_STORAGE_KEY))).toEqual({
        themeMode: 'system',
        density: 'comfortable',
        highContrast: false,
        reduceMotion: false,
      });
    });
  });
});
