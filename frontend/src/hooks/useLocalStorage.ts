import { useCallback, useEffect, useState } from 'react';

/**
 * Persist a piece of React state to localStorage.
 * SSR-safe (guards `window`) and tolerant of serialization errors.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (v: T | ((p: T) => T)) => void] {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  }, [key, initial]);

  const [stored, setStored] = useState<T>(readValue);

  const setValue = useCallback(
    (v: T | ((p: T) => T)) => {
      setStored((prev) => {
        const next =
          typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(key, JSON.stringify(next));
          } catch {
            /* ignore write failures (quota, private mode, etc.) */
          }
        }
        return next;
      });
    },
    [key],
  );

  // Keep state in sync if the same key changes in another tab.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setStored(readValue());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, readValue]);

  return [stored, setValue];
}
