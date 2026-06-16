import { useCallback, useMemo } from 'react';
import type { AppSettings } from '../types';
import { useLocalStorage } from './useLocalStorage';

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'groq',
  apiKey: '',
  model: '',
  stream: true,
};

const STORAGE_KEY = 'vyasa.settings';

export function useSettings(): {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  update: (patch: Partial<AppSettings>) => void;
  reset: () => void;
} {
  const [raw, setRaw] = useLocalStorage<AppSettings>(
    STORAGE_KEY,
    DEFAULT_SETTINGS,
  );

  // Merge with defaults so settings saved by older versions backfill new fields.
  const settings = useMemo<AppSettings>(
    () => ({ ...DEFAULT_SETTINGS, ...raw }),
    [raw],
  );

  const setSettings = useCallback(
    (s: AppSettings) => setRaw(s),
    [setRaw],
  );

  const update = useCallback(
    (patch: Partial<AppSettings>) => {
      setRaw((prev) => ({ ...DEFAULT_SETTINGS, ...prev, ...patch }));
    },
    [setRaw],
  );

  const reset = useCallback(() => {
    setRaw(DEFAULT_SETTINGS);
  }, [setRaw]);

  return { settings, setSettings, update, reset };
}
