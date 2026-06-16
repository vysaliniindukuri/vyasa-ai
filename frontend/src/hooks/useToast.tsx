import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Info, X } from 'lucide-react';
import clsx from 'clsx';

type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, opts?: { tone?: ToastTone; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => undefined });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const TONE_STYLES: Record<ToastTone, string> = {
  success: 'border-emerald-400/25 text-emerald-100',
  error: 'border-red-400/25 text-red-100',
  info: 'border-white/15 text-white/90',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback(
    (message: string, opts?: { tone?: ToastTone; duration?: number }) => {
      const id = (idRef.current += 1);
      const tone = opts?.tone ?? 'success';
      setToasts((prev) => [...prev, { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, opts?.duration ?? 2400);
    },
    [],
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              className={clsx(
                'pointer-events-auto flex items-center gap-2.5 rounded-2xl border bg-ink-850/80 px-4 py-2.5 text-sm font-medium shadow-glass backdrop-blur-2xl',
                TONE_STYLES[t.tone],
              )}
              role="status"
            >
              {t.tone === 'success' ? (
                <Check className="h-4 w-4 text-emerald-300" />
              ) : t.tone === 'error' ? (
                <X className="h-4 w-4 text-red-300" />
              ) : (
                <Info className="h-4 w-4 text-accent-blue" />
              )}
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="ml-1 text-white/40 transition-colors hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
