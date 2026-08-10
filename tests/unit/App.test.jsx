import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { AppProviders } from '@/app/providers.jsx';
import { appRoutes } from '@/app/router.jsx';
import { ApiError } from '@/api/api-error.js';

const user = {
  id: 1,
  email: 'admin@example.test',
  displayName: 'Admin User',
  status: 'ACTIVE',
};

function createService(recoverSession) {
  return {
    recoverSession,
    login: vi.fn(),
    logout: vi.fn(),
    logoutAll: vi.fn(),
    clearSession: vi.fn(),
    setSessionExpiredHandler: vi.fn(),
  };
}

function renderRoute(path, service) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <AppProviders
      authProviderProps={{ service, queryClientInstance: queryClient }}
    >
      <RouterProvider router={router} />
    </AppProviders>,
  );

  return router;
}

describe('rutas base', () => {
  it('muestra el inicio al usuario autenticado', async () => {
    const service = createService(() =>
      Promise.resolve({ user, permissions: ['users.read'] }),
    );
    renderRoute('/', service);

    expect(
      await screen.findByRole('heading', { name: 'Nexora Admin' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sesión iniciada como Admin User/i),
    ).toBeInTheDocument();
  });

  it('envía al usuario anónimo hacia login', async () => {
    const service = createService(() =>
      Promise.reject(
        new ApiError({
          code: 'SESSION_EXPIRED',
          message: 'Expired',
          status: 401,
        }),
      ),
    );
    const router = renderRoute('/', service);

    expect(
      await screen.findByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('evita que un usuario autenticado vuelva al login', async () => {
    const service = createService(() =>
      Promise.resolve({ user, permissions: ['users.read'] }),
    );
    const router = renderRoute('/login', service);

    expect(
      await screen.findByRole('heading', { name: 'Nexora Admin' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('muestra 404 para /register sin ofrecer registro', async () => {
    const service = createService(() =>
      Promise.reject(
        new ApiError({
          code: 'SESSION_EXPIRED',
          message: 'Expired',
          status: 401,
        }),
      ),
    );
    renderRoute('/register', service);

    expect(
      await screen.findByRole('heading', { name: '404' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/crear cuenta|registrarse|sign up/i),
    ).not.toBeInTheDocument();
  });
});
