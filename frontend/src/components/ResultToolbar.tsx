import { motion } from 'framer-motion';
import { Check, Copy, Download, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useClipboard } from '../hooks/useClipboard';
import { useToast } from '../hooks/useToast';
import { downloadTextFile } from '../lib/download';
import { fadeIn } from '../lib/motion';

interface ResultToolbarProps {
  /** Assembled Markdown document for copy-all / export. */
  markdown: string;
  /** Base filename (without extension) for the export. */
  filename: string;
  onRegenerate: () => void;
  loading?: boolean;
}

const btn =
  'inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50';

/** Action row above the result cards: copy all, export to .md, and regenerate. */
export function ResultToolbar({
  markdown,
  filename,
  onRegenerate,
  loading = false,
}: ResultToolbarProps) {
  const { copied, copy } = useClipboard();
  const { toast } = useToast();

  const handleCopy = () => {
    copy(markdown);
    toast('Copied all sections to clipboard');
  };

  const handleExport = () => {
    downloadTextFile(`${filename}.md`, markdown);
    toast('Exported as Markdown');
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="show"
      className="mb-5 flex flex-wrap items-center gap-2"
    >
      <button type="button" onClick={handleCopy} className={btn}>
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-300" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? 'Copied' : 'Copy all'}
      </button>

      <button type="button" onClick={handleExport} className={btn}>
        <Download className="h-3.5 w-3.5" />
        Export .md
      </button>

      <button
        type="button"
        onClick={onRegenerate}
        disabled={loading}
        className={clsx(btn, 'ml-auto')}
      >
        <RefreshCw className={clsx('h-3.5 w-3.5', loading && 'animate-spin')} />
        Regenerate
      </button>
    </motion.div>
  );
}
