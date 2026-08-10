import { App as AntApp } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountPage } from '@/modules/auth/pages/AccountPage.jsx';

const auth = {
  user: {
    id: 1,
    email: 'admin@example.test',
    displayName: 'Admin User',
    status: 'ACTIVE',
    mustChangePassword: false,
  },
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
};

vi.mock('@/auth/useAuth.js', () => ({ useAuth: () => auth }));

function renderPage(path) {
  return render(
    <AntApp>
      <MemoryRouter initialEntries={[path]}>
        <AccountPage />
      </MemoryRouter>
    </AntApp>,
  );
}

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.updateProfile.mockResolvedValue(auth.user);
    auth.changePassword.mockResolvedValue(auth.user);
  });

  it('updates the current profile with the visible version', async () => {
    const user = userEvent.setup();
    renderPage('/profile');

    const name = screen.getByLabelText('Nombre');
    await user.clear(name);
    await user.type(name, 'Updated Admin');
    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }));

    await waitFor(() =>
      expect(auth.updateProfile).toHaveBeenCalledWith({
        displayName: 'Updated Admin',
      }),
    );
  });

  it('completes the forced password-change form', async () => {
    const user = userEvent.setup();
    renderPage('/change-password');

    expect(
      screen.getByText('Cambio de contraseña obligatorio'),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText('Contraseña actual'), 'old-password');
    await user.type(
      screen.getByLabelText('Nueva contraseña'),
      'new-secure-password',
    );
    await user.type(
      screen.getByLabelText('Confirmar nueva contraseña'),
      'new-secure-password',
    );
    await user.click(
      screen.getByRole('button', { name: 'Cambiar contraseña' }),
    );

    await waitFor(() =>
      expect(auth.changePassword).toHaveBeenCalledWith({
        currentPassword: 'old-password',
        newPassword: 'new-secure-password',
      }),
    );
  });
});
