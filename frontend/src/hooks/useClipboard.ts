import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Copy text to the clipboard and surface a transient `copied` flag.
 * The flag auto-resets after `timeout` ms (default ~1.6s).
 */
export function useClipboard(timeout = 1600): {
  copied: boolean;
  copy: (text: string) => void;
} {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const copy = useCallback(
    (text: string) => {
      const onSuccess = () => {
        setCopied(true);
        clear();
        timer.current = setTimeout(() => setCopied(false), timeout);
      };

      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        navigator.clipboard.writeText(text).then(onSuccess, () => {
          fallbackCopy(text);
          onSuccess();
        });
      } else {
        fallbackCopy(text);
        onSuccess();
      }
    },
    [clear, timeout],
  );

  useEffect(() => clear, [clear]);

  return { copied, copy };
}

/** Legacy fallback for environments without the async Clipboard API. */
function fallbackCopy(text: string): void {
  if (typeof document === 'undefined') return;
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  } catch {
    /* best-effort; ignore */
  }
}
