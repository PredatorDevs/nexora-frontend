import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthContext } from '@/auth/auth-context.js';
import { Can } from '@/components/authorization/Can.jsx';
import { permissions } from '@/config/permissions.js';

function renderCan(component, effectivePermissions = []) {
  return render(
    <AuthContext.Provider
      value={{ status: 'authenticated', permissions: effectivePermissions }}
    >
      {component}
    </AuthContext.Provider>,
  );
}

describe('Can', () => {
  it('renderiza contenido cuando el permiso es efectivo', () => {
    renderCan(<Can permission={permissions.users.create}>Crear usuario</Can>, [
      permissions.users.create,
    ]);

    expect(screen.getByText('Crear usuario')).toBeInTheDocument();
  });

  it('oculta contenido y admite fallback cuando se deniega', () => {
    renderCan(
      <Can permission={permissions.users.create} fallback="Sin acceso">
        Crear usuario
      </Can>,
      [permissions.users.read],
    );

    expect(screen.queryByText('Crear usuario')).not.toBeInTheDocument();
    expect(screen.getByText('Sin acceso')).toBeInTheDocument();
  });

  it('soporta condiciones anyOf y allOf', () => {
    renderCan(
      <Can
        anyOf={[permissions.users.update, permissions.users.changeStatus]}
        allOf={[permissions.users.read, permissions.users.update]}
      >
        Acciones avanzadas
      </Can>,
      [permissions.users.read, permissions.users.update],
    );

    expect(screen.getByText('Acciones avanzadas')).toBeInTheDocument();
  });

  it('deniega cuando no se declara ningún requisito', () => {
    renderCan(<Can>Contenido inseguro</Can>, permissionCodesFixture());
    expect(screen.queryByText('Contenido inseguro')).not.toBeInTheDocument();
  });
});

function permissionCodesFixture() {
  return [permissions.users.read, permissions.roles.read];
}
