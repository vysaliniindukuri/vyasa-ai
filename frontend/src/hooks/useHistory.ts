import { useCallback } from 'react';
import type { HistoryEntry, NewHistoryEntry } from '../types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'vyasa.history';
const MAX_ENTRIES = 40;

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

export interface HistoryApi {
  items: HistoryEntry[];
  add: (entry: NewHistoryEntry) => void;
  remove: (id: string) => void;
  clear: () => void;
}

/** Persisted, capped list of past generations (newest first). */
export function useHistory(): HistoryApi {
  const [items, setItems] = useLocalStorage<HistoryEntry[]>(STORAGE_KEY, []);

  const add = useCallback(
    (entry: NewHistoryEntry) => {
      const full: HistoryEntry = {
        ...entry,
        id: makeId(),
        createdAt: Date.now(),
      };
      setItems((prev) => [full, ...prev].slice(0, MAX_ENTRIES));
    },
    [setItems],
  );

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((e) => e.id !== id)),
    [setItems],
  );

  const clear = useCallback(() => setItems([]), [setItems]);

  return { items, add, remove, clear };
}
