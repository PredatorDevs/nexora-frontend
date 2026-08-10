import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { ThemeSwitch } from '@/components/preferences/ThemeSwitch.jsx';
import { PREFERENCE_STORAGE_KEY } from '@/preferences/preference-storage.js';
import { PreferencesProvider } from '@/preferences/PreferencesProvider.jsx';

describe('ThemeSwitch', () => {
  beforeEach(() => localStorage.clear());

  it('alterna y persiste un tema explícito desde el tema efectivo', async () => {
    const actor = userEvent.setup();
    render(
      <PreferencesProvider>
        <ThemeSwitch />
      </PreferencesProvider>,
    );

    await actor.click(
      screen.getByRole('switch', { name: 'Cambiar a tema oscuro' }),
    );
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      expect(
        JSON.parse(localStorage.getItem(PREFERENCE_STORAGE_KEY)),
      ).toMatchObject({ themeMode: 'dark' });
    });

    await actor.click(
      screen.getByRole('switch', { name: 'Cambiar a tema claro' }),
    );
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'light');
      expect(
        JSON.parse(localStorage.getItem(PREFERENCE_STORAGE_KEY)),
      ).toMatchObject({ themeMode: 'light' });
    });
  });
});
