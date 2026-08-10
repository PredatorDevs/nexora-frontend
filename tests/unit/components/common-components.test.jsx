import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '@/components/feedback/ConfirmDialog.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { ErrorState } from '@/components/feedback/ErrorState.jsx';
import { LoadingState } from '@/components/feedback/LoadingState.jsx';
import { FormActions } from '@/components/forms/FormActions.jsx';
import { SearchInput } from '@/components/forms/SearchInput.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';

describe('componentes comunes', () => {
  it('renderiza encabezado, acciones y estados', () => {
    render(
      <>
        <PageHeader
          title="Usuarios"
          description="Administra usuarios"
          extra={<button>Crear</button>}
        />
        <StatusBadge status="ACTIVE" />
        <LoadingState message="Consultando usuarios…" />
      </>,
    );

    expect(
      screen.getByRole('heading', { name: 'Usuarios' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Consultando usuarios…')).toBeInTheDocument();
  });

  it('expone acciones de vacío y reintento con requestId', () => {
    const action = vi.fn();
    const retry = vi.fn();
    render(
      <>
        <EmptyState
          title="Sin usuarios"
          actionLabel="Crear usuario"
          onAction={action}
        />
        <ErrorState
          error={{ code: 'NETWORK_ERROR', requestId: 'request-8' }}
          onRetry={retry}
        />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(action).toHaveBeenCalledOnce();
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByText(/request-8/)).toBeInTheDocument();
  });

  it('controla búsqueda y acciones de formulario', () => {
    const onChange = vi.fn();
    const onSearch = vi.fn();
    const onCancel = vi.fn();
    render(
      <>
        <SearchInput value="" onChange={onChange} onSearch={onSearch} />
        <FormActions onCancel={onCancel} />
      </>,
    );

    fireEvent.change(screen.getByPlaceholderText('Buscar…'), {
      target: { value: 'Ada' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onChange).toHaveBeenCalledWith('Ada');
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('confirma o cancela una operación explícitamente', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Desactivar usuario"
        description="Esta acción cerrará sus sesiones."
        danger
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
