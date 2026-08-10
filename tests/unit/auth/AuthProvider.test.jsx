import { QueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/api-error.js';
import { AuthProvider } from '@/auth/AuthProvider.jsx';
import { useAuth } from '@/auth/useAuth.js';

const user = {
  id: 4,
  email: 'admin@example.test',
  displayName: 'Admin User',
  status: 'ACTIVE',
};

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="user">{auth.user?.displayName ?? 'none'}</span>
      <span data-testid="permission">
        {String(auth.hasPermission('users.read'))}
      </span>
      <span data-testid="initialization-error">
        {auth.initializationError?.code ?? 'none'}
      </span>
      <button type="button" onClick={() => auth.login({})}>
        Login
      </button>
      <button type="button" onClick={() => auth.logout()}>
        Logout
      </button>
    </div>
  );
}

function createService(overrides = {}) {
  return {
    recoverSession: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    logoutAll: vi.fn(),
    clearSession: vi.fn(),
    setSessionExpiredHandler: vi.fn(),
    ...overrides,
  };
}

function renderProvider(service) {
  const queryClient = new QueryClient();
  render(
    <AuthProvider service={service} queryClientInstance={queryClient}>
      <Probe />
    </AuthProvider>,
  );
  return queryClient;
}

describe('AuthProvider', () => {
  it('recupera la sesión y expone permisos', async () => {
    const service = createService({
      recoverSession: vi.fn().mockResolvedValue({
        user,
        permissions: ['users.read'],
      }),
    });
    renderProvider(service);

    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    );
    expect(screen.getByTestId('user')).toHaveTextContent('Admin User');
    expect(screen.getByTestId('permission')).toHaveTextContent('true');
  });

  it('trata una sesión expirada como estado anónimo normal', async () => {
    const service = createService({
      recoverSession: vi.fn().mockRejectedValue(
        new ApiError({
          code: 'SESSION_EXPIRED',
          message: 'Expired',
          status: 401,
        }),
      ),
    });
    renderProvider(service);

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    );
    expect(screen.getByTestId('initialization-error')).toHaveTextContent(
      'none',
    );
  });

  it('conserva un error de red ocurrido durante la recuperación', async () => {
    const service = createService({
      recoverSession: vi
        .fn()
        .mockRejectedValue(
          new ApiError({ code: 'NETWORK_ERROR', message: 'Offline' }),
        ),
    });
    renderProvider(service);

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    );
    expect(screen.getByTestId('initialization-error')).toHaveTextContent(
      'NETWORK_ERROR',
    );
  });

  it('actualiza la sesión al hacer login y limpia la caché al salir', async () => {
    const service = createService({
      recoverSession: vi.fn().mockRejectedValue(
        new ApiError({
          code: 'SESSION_EXPIRED',
          message: 'Expired',
          status: 401,
        }),
      ),
      login: vi.fn().mockResolvedValue({ user, permissions: ['users.read'] }),
      logout: vi.fn().mockResolvedValue(undefined),
    });
    const queryClient = renderProvider(service);
    queryClient.setQueryData(['private'], { secret: true });

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    );

    queryClient.setQueryData(['private'], { secret: true });
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'),
    );
    expect(queryClient.getQueryData(['private'])).toBeUndefined();
    expect(service.clearSession).toHaveBeenCalled();
  });
});
