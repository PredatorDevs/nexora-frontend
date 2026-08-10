import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/api-error.js';
import { AppProviders } from '@/app/providers.jsx';
import { appRoutes } from '@/app/router.jsx';

const authenticatedSession = {
  user: {
    id: 1,
    email: 'admin@example.test',
    displayName: 'Admin User',
    status: 'ACTIVE',
  },
  permissions: ['users.read'],
};

function createAnonymousService(login) {
  return {
    recoverSession: vi.fn().mockRejectedValue(
      new ApiError({
        code: 'SESSION_EXPIRED',
        message: 'Expired',
        status: 401,
      }),
    ),
    login,
    logout: vi.fn(),
    logoutAll: vi.fn(),
    clearSession: vi.fn(),
    setSessionExpiredHandler: vi.fn(),
  };
}

function renderApplication(initialPath, service) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialPath],
  });
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

describe('flujo de login', () => {
  it('regresa a la ruta privada solicitada después de autenticarse', async () => {
    const actor = userEvent.setup();
    const login = vi.fn().mockResolvedValue(authenticatedSession);
    const router = renderApplication('/', createAnonymousService(login));

    expect(
      await screen.findByRole('heading', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument();

    await actor.type(
      screen.getByLabelText('Correo electrónico'),
      'admin@example.test',
    );
    await actor.type(screen.getByLabelText('Contraseña'), 'secure-password');
    await actor.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(
      await screen.findByRole('heading', { name: 'Nexora Admin' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(login).toHaveBeenCalledWith({
      email: 'admin@example.test',
      password: 'secure-password',
    });
  });

  it('muestra el error de credenciales sin revelar la causa', async () => {
    const actor = userEvent.setup();
    const login = vi.fn().mockRejectedValue(
      new ApiError({
        code: 'INVALID_CREDENTIALS',
        message: 'The provided credentials are invalid.',
        status: 401,
      }),
    );
    renderApplication('/login', createAnonymousService(login));

    await actor.type(
      await screen.findByLabelText('Correo electrónico'),
      'admin@example.test',
    );
    await actor.type(screen.getByLabelText('Contraseña'), 'wrong-password');
    await actor.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(
      await screen.findByText('El correo o la contraseña no son válidos.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/crear cuenta|registrarse|sign up/i),
    ).not.toBeInTheDocument();
  });
});
