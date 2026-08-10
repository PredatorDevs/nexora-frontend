import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { lazyRoute } from '@/app/lazy-route.jsx';

describe('lazyRoute', () => {
  it('muestra el fallback y luego resuelve el export nombrado', async () => {
    let resolveModule;
    const importer = () =>
      new Promise((resolve) => {
        resolveModule = resolve;
      });

    render(lazyRoute(importer, 'ExamplePage'));
    expect(screen.getByText('Cargando…')).toBeInTheDocument();

    resolveModule({ ExamplePage: () => <h1>Página diferida</h1> });
    expect(
      await screen.findByRole('heading', { name: 'Página diferida' }),
    ).toBeInTheDocument();
  });
});
