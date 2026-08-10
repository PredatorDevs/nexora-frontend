import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DataTable } from '@/components/tables/DataTable.jsx';

const columns = [
  { title: 'Nombre', dataIndex: 'name', key: 'name', sorter: true },
  { title: 'Correo', dataIndex: 'email', key: 'email' },
];

describe('DataTable', () => {
  it('renderiza datos y traduce ordenamiento al contrato del backend', () => {
    const onChange = vi.fn();
    render(
      <DataTable
        ariaLabel="Usuarios"
        columns={columns}
        dataSource={[{ id: 1, name: 'Ada', email: 'ada@example.test' }]}
        onChange={onChange}
        pagination={{ page: 1, pageSize: 20, total: 1 }}
      />,
    );

    expect(
      screen.getByRole('region', { name: 'Usuarios' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('columnheader', { name: /Nombre/ }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 20,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
    );
  });

  it('muestra estado vacío y error recuperable', () => {
    const { rerender } = render(
      <DataTable columns={columns} emptyTitle="Sin usuarios" />,
    );
    expect(screen.getByText('Sin usuarios')).toBeInTheDocument();

    const onRetry = vi.fn();
    rerender(
      <DataTable
        columns={columns}
        error={{ code: 'NETWORK_ERROR' }}
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
