import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { MarkdownView } from './MarkdownView';

interface StreamingViewProps {
  content: string;
  label?: string;
}

/**
 * Live "writing" surface shown while a streamed generation is in flight. The
 * Markdown re-renders as tokens arrive, with a soft pulsing caret at the end.
 */
export function StreamingView({ content, label = 'Writing…' }: StreamingViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-2xl sm:p-6"
    >
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/60">
        <motion.span
          animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-accent-indigo"
        >
          <Sparkles className="h-4 w-4" />
        </motion.span>
        {label}
      </div>

      <div className="relative">
        <MarkdownView content={content} />
        <motion.span
          aria-hidden="true"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 rounded-full bg-accent-indigo align-middle"
        />
      </div>
    </motion.div>
  );
}
