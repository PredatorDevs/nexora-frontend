import { describe, expect, it, vi } from 'vitest';

import { applyApiValidationErrors } from '@/components/forms/form-error-utils.js';

describe('applyApiValidationErrors', () => {
  it('mapea únicamente errores válidos del body', () => {
    const setError = vi.fn();
    const applied = applyApiValidationErrors(
      {
        code: 'VALIDATION_ERROR',
        details: [
          { location: 'body', path: 'email', message: 'El correo ya existe.' },
          { location: 'query', path: 'page', message: 'Página inválida.' },
          { location: 'body', path: '', message: 'Inválido.' },
        ],
      },
      setError,
    );

    expect(applied).toBe(1);
    expect(setError).toHaveBeenCalledWith('email', {
      type: 'server',
      message: 'El correo ya existe.',
    });
  });

  it('ignora errores que no son de validación', () => {
    expect(applyApiValidationErrors({ code: 'FORBIDDEN' }, vi.fn())).toBe(0);
  });
});
