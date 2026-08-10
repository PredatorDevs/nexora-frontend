import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDebounce } from '@/hooks/useDebounce.js';
import { useDisclosure } from '@/hooks/useDisclosure.js';

afterEach(() => vi.useRealTimers());

describe('hooks comunes', () => {
  it('retrasa la publicación de un valor', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 'a' },
      },
    );

    rerender({ value: 'ab' });
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('ab');
  });

  it('abre, cierra y alterna una disclosure', () => {
    const { result } = renderHook(() => useDisclosure());
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });
});
