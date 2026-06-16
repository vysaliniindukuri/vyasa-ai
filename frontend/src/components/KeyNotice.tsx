import { motion } from 'framer-motion';
import { KeyRound, ArrowRight } from 'lucide-react';
import { fadeInUp } from '../lib/motion';

interface KeyNoticeProps {
  onOpenSettings: () => void;
}

/**
 * Gentle onboarding banner shown when no API key is set in this browser.
 * Acknowledges the backend `.env` fallback so it never feels like a hard error.
 */
export function KeyNotice({ onOpenSettings }: KeyNoticeProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-3 rounded-2xl border border-accent-blue/20 bg-accent-blue/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue">
          <KeyRound className="h-5 w-5" />
        </span>
        <p className="text-sm leading-relaxed text-white/70">
          <span className="font-semibold text-white">No API key set in this browser.</span>{' '}
          Add one in Settings to start generating — or ignore this if your backend
          already has a key configured via <code className="rounded bg-white/10 px-1 py-0.5 text-xs text-accent-pink">.env</code>.
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenSettings}
        className="group inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 sm:self-auto"
      >
        Open Settings
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </motion.div>
  );
}
