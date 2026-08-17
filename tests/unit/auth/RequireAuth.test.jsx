import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RequireAuth } from '@/auth/RequireAuth.jsx';

const useAuth = vi.fn();
vi.mock('@/auth/useAuth.js', () => ({ useAuth: () => useAuth() }));

function renderRoute(path = '/users') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/users" element={<div>Platform users</div>} />
          <Route path="/select-company" element={<div>Company selector</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  beforeEach(() => {
    useAuth.mockReset();
  });

  it('keeps a platform administrator outside company context', () => {
    useAuth.mockReturnValue({
      status: 'authenticated',
      user: { mustChangePassword: false },
      memberships: [{ id: 10 }],
      activeMembership: null,
      requiresCompanySelection: false,
    });
    renderRoute();
    expect(screen.getByText('Platform users')).toBeInTheDocument();
  });

  it('redirects only when the session explicitly requires company selection', () => {
    useAuth.mockReturnValue({
      status: 'authenticated',
      user: { mustChangePassword: false },
      requiresCompanySelection: true,
    });
    renderRoute();
    expect(screen.getByText('Company selector')).toBeInTheDocument();
  });
});
