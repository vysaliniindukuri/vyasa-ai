import type { KeyboardEvent } from 'react';
import clsx from 'clsx';

interface NoteInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  /** Invoked on ⌘/Ctrl + Enter for quick generation. */
  onSubmit?: () => void;
}

/**
 * Large frosted-glass textarea with an accent focus ring, a subtle live
 * character count, and a ⌘/Ctrl+Enter shortcut hint.
 */
export function NoteInput({
  value,
  onChange,
  placeholder = 'Paste your raw notes here…',
  rows = 10,
  onSubmit,
}: NoteInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (onSubmit && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="group relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        aria-label="Notes input"
        spellCheck
        className={clsx(
          'w-full resize-y rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 pb-9 text-[15px] leading-relaxed text-white/90 placeholder:text-white/30',
          'shadow-inner outline-none transition-all duration-300',
          'focus:border-accent-indigo/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-accent-indigo/30',
        )}
      />
      <div className="pointer-events-none absolute bottom-3 right-4 flex items-center gap-3 text-[11px] font-medium tabular-nums text-white/30">
        <span className="hidden sm:inline">
          <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-sans">⌘</kbd>
          <kbd className="ml-0.5 rounded border border-white/15 bg-white/5 px-1 py-0.5 font-sans">↵</kbd>
          <span className="ml-1.5">to generate</span>
        </span>
        <span>{value.length.toLocaleString()} chars</span>
      </div>
    </div>
  );
}
