import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  ClipboardList,
  Clock,
  FileText,
  History as HistoryIcon,
  Mail,
  RotateCcw,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { GenKind, HistoryEntry } from '../types';
import { KIND_TITLES } from '../lib/sections';
import { formatRelativeTime } from '../lib/time';

interface HistoryPanelProps {
  open: boolean;
  items: HistoryEntry[];
  onClose: () => void;
  onRestore: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const KIND_ICON: Record<GenKind, LucideIcon> = {
  summary: FileText,
  email: Mail,
  daily: ClipboardList,
  weekly: CalendarDays,
};

export function HistoryPanel({
  open,
  items,
  onClose,
  onRestore,
  onRemove,
  onClear,
}: HistoryPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-white/10 bg-ink-900/85 shadow-glass backdrop-blur-2xl"
            role="dialog"
            aria-label="Generation history"
          >
            <header className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 text-accent-blue ring-1 ring-inset ring-white/10">
                <HistoryIcon className="h-5 w-5" />
              </span>
              <h2 className="flex-1 text-base font-semibold tracking-tight text-white">
                History
              </h2>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close history"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/30">
                    <Clock className="h-6 w-6" />
                  </span>
                  <p className="text-sm text-white/45">
                    Nothing here yet. Your generated summaries, emails, and reports
                    will appear here automatically.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {items.map((entry) => {
                    const Icon = KIND_ICON[entry.kind];
                    return (
                      <li key={entry.id}>
                        <div className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 text-accent-blue">
                            <Icon className="h-4 w-4" />
                          </span>
                          <button
                            type="button"
                            onClick={() => onRestore(entry)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate text-sm font-medium text-white">
                              {entry.title}
                            </p>
                            <p className="mt-0.5 text-xs text-white/40">
                              {KIND_TITLES[entry.kind]}
                              {entry.tone ? ` · ${entry.tone}` : ''} ·{' '}
                              {formatRelativeTime(entry.createdAt)}
                            </p>
                          </button>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onRestore(entry)}
                              aria-label="Restore"
                              title="Restore"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-accent-blue"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemove(entry.id)}
                              aria-label="Delete"
                              title="Delete"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
