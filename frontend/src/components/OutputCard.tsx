import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Copy } from 'lucide-react';
import clsx from 'clsx';
import { fadeInUp, cardHover, EASE } from '../lib/motion';
import { useClipboard } from '../hooks/useClipboard';
import { MarkdownView } from './MarkdownView';

interface OutputCardProps {
  title: string;
  icon?: ReactNode;
  content: string;
  index?: number;
  accent?: string;
}

const PREVIEW_MAX_HEIGHT = 168;

/**
 * Glass result card: header with icon, title, copy and expand controls; body
 * renders Markdown and collapses to a clamped preview until expanded. Animates
 * in with a stagger driven by `index`.
 */
export function OutputCard({
  title,
  icon,
  content,
  index = 0,
  accent = 'from-accent-blue to-accent-purple',
}: OutputCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { copied, copy } = useClipboard();
  const hasContent = Boolean(content && content.trim());

  return (
    <motion.div
      variants={fadeInUp}
      custom={index}
      whileHover={cardHover}
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-glass backdrop-blur-2xl"
    >
      <header className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <span
          className={clsx(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-glow',
            accent,
          )}
        >
          {icon}
        </span>
        <h3 className="flex-1 truncate text-sm font-semibold tracking-tight text-white">
          {title}
        </h3>

        <button
          type="button"
          onClick={() => hasContent && copy(content)}
          disabled={!hasContent}
          aria-label={`Copy ${title}`}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
            'text-white/55 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`}
          aria-expanded={expanded}
          className="inline-flex items-center justify-center rounded-lg p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
        >
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="inline-flex"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>
      </header>

      <div className="relative flex-1 px-5 py-4">
        <AnimatePresence initial={false} mode="wait">
          {expanded ? (
            <motion.div
              key="expanded"
              initial={{ height: PREVIEW_MAX_HEIGHT, opacity: 0.6 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: PREVIEW_MAX_HEIGHT, opacity: 0.6 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="overflow-hidden"
            >
              <MarkdownView content={content} />
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.6 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="relative overflow-hidden"
              style={{ maxHeight: PREVIEW_MAX_HEIGHT }}
            >
              <MarkdownView content={content} />
              {hasContent && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-ink-900/80 to-transparent" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
