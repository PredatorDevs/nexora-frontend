import { useEffect, useState } from 'react';

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(
      () => setDebouncedValue(value),
      Math.max(0, delay),
    );
    return () => clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}
