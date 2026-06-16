import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../lib/motion';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * Calm centered placeholder shown before the first generation in a workspace.
 */
export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-20 text-center"
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-accent-blue/15 to-accent-purple/15 text-accent-blue">
          {icon}
        </div>
      )}
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-white/85">{title}</p>
        {subtitle && (
          <p className="mx-auto max-w-md text-sm leading-relaxed text-white/45">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}
