import { useCallback, useRef, useState } from 'react';
import { ApiError } from '../types';

/** A streaming strategy: how to start the stream and how to parse the result. */
export interface StreamConfig<T> {
  start: (
    text: string,
    handlers: { onDelta: (chunk: string) => void; signal: AbortSignal },
  ) => Promise<string>;
  parse: (full: string) => T;
}

export interface UseGeneratorOptions<T> {
  /** Streaming strategy; when present and `streaming` is true, runs streamed. */
  stream?: StreamConfig<T>;
  /** Whether to prefer the streaming path (falls back to non-streaming). */
  streaming?: boolean;
  /** Fired once after a successful generation, with the result and input. */
  onSuccess?: (data: T, input: string) => void;
}

export interface GeneratorState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  /** Live partial text while a streaming generation is in flight. */
  partial: string;
}

export interface GeneratorApi<T> {
  run: (text: string) => Promise<void>;
  regenerate: () => Promise<void>;
  reset: () => void;
  /** Imperatively set the result (used to restore from history). */
  setData: (data: T | null) => void;
}

function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  return new ApiError(e instanceof Error ? e.message : 'Something went wrong.', {
    code: 'unknown',
  });
}

/**
 * Async runner for the generation endpoints. Supports both a non-streaming
 * promise (`fn`) and an optional live-streaming strategy. Latest `fn`/options
 * are read from refs so `run` stays stable across renders.
 */
export function useGenerator<T>(
  fn: (text: string) => Promise<T>,
  options?: UseGeneratorOptions<T>,
): GeneratorState<T> & GeneratorApi<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [partial, setPartial] = useState('');

  const fnRef = useRef(fn);
  fnRef.current = fn;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const lastInputRef = useRef<string>('');
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (text: string) => {
    const opts = optionsRef.current;

    if (!text.trim()) {
      setError(new ApiError('Please paste some notes first.', { code: 'empty' }));
      return;
    }

    lastInputRef.current = text;
    setLoading(true);
    setError(null);
    setPartial('');

    const useStream = Boolean(opts?.streaming && opts?.stream);

    try {
      if (useStream && opts?.stream) {
        const controller = new AbortController();
        abortRef.current = controller;
        const full = await opts.stream.start(text, {
          onDelta: (chunk) => setPartial((p) => p + chunk),
          signal: controller.signal,
        });
        const result = opts.stream.parse(full);
        setData(result);
        opts.onSuccess?.(result, text);
      } else {
        const result = await fnRef.current(text);
        setData(result);
        opts?.onSuccess?.(result, text);
      }
    } catch (e) {
      // A user-initiated abort (Clear / new run) is not an error.
      if (e instanceof DOMException && e.name === 'AbortError') return;
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(toApiError(e));
    } finally {
      abortRef.current = null;
      setLoading(false);
      setPartial('');
    }
  }, []);

  const regenerate = useCallback(async () => {
    if (lastInputRef.current.trim()) {
      await run(lastInputRef.current);
    }
  }, [run]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setData(null);
    setError(null);
    setLoading(false);
    setPartial('');
  }, []);

  return { data, loading, error, partial, run, regenerate, reset, setData };
}
