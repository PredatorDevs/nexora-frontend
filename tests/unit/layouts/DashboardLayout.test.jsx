import { App, ConfigProvider } from 'antd';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { AuthContext } from '@/auth/auth-context.js';
import { permissions } from '@/config/permissions.js';
import { DashboardLayout } from '@/layouts/DashboardLayout.jsx';
import { PreferencesProvider } from '@/preferences/PreferencesProvider.jsx';

const user = {
  id: 1,
  email: 'admin@example.test',
  displayName: 'Admin User',
  status: 'ACTIVE',
};

function renderLayout() {
  const logout = vi.fn().mockResolvedValue(undefined);
  const logoutAll = vi.fn().mockResolvedValue(undefined);
  const router = createMemoryRouter(
    [
      {
        element: <DashboardLayout />,
        children: [{ path: '/', element: <h1>Contenido principal</h1> }],
      },
    ],
    { initialEntries: ['/'] },
  );

  render(
    <PreferencesProvider>
      <ConfigProvider>
        <App>
          <AuthContext.Provider
            value={{
              status: 'authenticated',
              user,
              permissions: [permissions.users.read],
              logout,
              logoutAll,
            }}
          >
            <RouterProvider router={router} />
          </AuthContext.Provider>
        </App>
      </ConfigProvider>
    </PreferencesProvider>,
  );

  return { logout, logoutAll };
}

describe('DashboardLayout', () => {
  it('muestra header, breadcrumbs y contenido', () => {
    renderLayout();

    expect(screen.getByText('Contenido principal')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Saltar al contenido principal' }),
    ).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(
      screen.getByRole('navigation', { name: 'Ruta de navegación' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Abrir menú de usuario' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Cambiar a tema oscuro' }),
    ).toBeInTheDocument();
  });

  it('abre y cierra la navegación móvil', async () => {
    const actor = userEvent.setup();
    renderLayout();

    await actor.click(screen.getByRole('button', { name: 'Abrir navegación' }));
    expect(
      await screen.findByRole('navigation', {
        name: 'Navegación principal móvil',
      }),
    ).toBeInTheDocument();

    await actor.click(screen.getByRole('link', { name: 'Inicio' }));
    await screen.findByRole('heading', { name: 'Contenido principal' });
  });

  it('permite cerrar sesión desde el menú de usuario', async () => {
    const actor = userEvent.setup();
    const { logout } = renderLayout();

    await actor.click(
      screen.getByRole('button', { name: 'Abrir menú de usuario' }),
    );
    await actor.click(await screen.findByText('Cerrar sesión'));

    expect(logout).toHaveBeenCalledOnce();
  });

  it('confirma antes de cerrar todas las sesiones', async () => {
    const actor = userEvent.setup();
    const { logoutAll } = renderLayout();

    await actor.click(
      screen.getByRole('button', { name: 'Abrir menú de usuario' }),
    );
    await actor.click(await screen.findByText('Cerrar todas las sesiones'));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(
        'Se revocarán las sesiones activas de todos tus dispositivos.',
      ),
    ).toBeInTheDocument();
    await actor.click(
      within(dialog).getByRole('button', { name: 'Cerrar todas' }),
    );

    expect(logoutAll).toHaveBeenCalledOnce();
  });
});
