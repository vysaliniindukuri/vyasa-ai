import { AlertTriangle, Info, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { fadeInUp } from '../lib/motion';
import { GradientButton } from './GradientButton';

type Tone = 'error' | 'warning' | 'info';

interface AlertCardProps {
  title?: string;
  message: string;
  tone?: Tone;
  onRetry?: () => void;
}

const TONE_STYLES: Record<
  Tone,
  { wrap: string; iconWrap: string; title: string }
> = {
  error: {
    wrap: 'border-red-400/20 bg-red-500/[0.07]',
    iconWrap: 'bg-red-500/15 text-red-300',
    title: 'text-red-200',
  },
  warning: {
    wrap: 'border-amber-400/20 bg-amber-500/[0.07]',
    iconWrap: 'bg-amber-500/15 text-amber-300',
    title: 'text-amber-200',
  },
  info: {
    wrap: 'border-accent-blue/25 bg-accent-blue/[0.07]',
    iconWrap: 'bg-accent-blue/15 text-accent-blue',
    title: 'text-white',
  },
};

const DEFAULT_TITLES: Record<Tone, string> = {
  error: 'Something went wrong',
  warning: 'Heads up',
  info: 'Note',
};

/**
 * Glass alert surface with a tinted icon and an optional retry action.
 */
export function AlertCard({
  title,
  message,
  tone = 'error',
  onRetry,
}: AlertCardProps) {
  const styles = TONE_STYLES[tone];
  const Icon = tone === 'info' ? Info : AlertTriangle;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      className={clsx(
        'flex items-start gap-4 rounded-3xl border p-5 shadow-glass backdrop-blur-2xl',
        styles.wrap,
      )}
      role="alert"
    >
      <div
        className={clsx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
          styles.iconWrap,
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="flex-1 space-y-2">
        <p className={clsx('text-sm font-semibold', styles.title)}>
          {title ?? DEFAULT_TITLES[tone]}
        </p>
        <p className="text-sm leading-relaxed text-white/65">{message}</p>
        {onRetry && (
          <div className="pt-1">
            <GradientButton
              variant="ghost"
              onClick={onRetry}
              icon={<RotateCcw className="h-4 w-4" />}
              className="px-4 py-2 text-xs"
            >
              Try again
            </GradientButton>
          </div>
        )}
      </div>
    </motion.div>
  );
}
