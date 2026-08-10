import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AuthContext } from '@/auth/auth-context.js';
import { RequirePermission } from '@/auth/RequirePermission.jsx';
import { permissions } from '@/config/permissions.js';

function renderRestricted({
  status = 'authenticated',
  effectivePermissions = [],
}) {
  const router = createMemoryRouter(
    [
      { path: '/login', element: <h1>Login</h1> },
      { path: '/unauthorized', element: <h1>Sin autorización</h1> },
      {
        element: <RequirePermission permission={permissions.users.read} />,
        children: [{ path: '/users', element: <h1>Usuarios</h1> }],
      },
    ],
    { initialEntries: ['/users'] },
  );

  render(
    <AuthContext.Provider value={{ status, permissions: effectivePermissions }}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );

  return router;
}

describe('RequirePermission', () => {
  it('permite acceder con el permiso efectivo', async () => {
    const router = renderRestricted({
      effectivePermissions: [permissions.users.read],
    });

    expect(
      await screen.findByRole('heading', { name: 'Usuarios' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/users');
  });

  it('redirige a 403 cuando falta el permiso', async () => {
    const router = renderRestricted({
      effectivePermissions: [permissions.roles.read],
    });

    expect(
      await screen.findByRole('heading', { name: 'Sin autorización' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/unauthorized');
  });

  it('redirige a login cuando no existe sesión', async () => {
    const router = renderRestricted({ status: 'unauthenticated' });

    expect(
      await screen.findByRole('heading', { name: 'Login' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });
});
