import { motion, type HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';
import { cardHover } from '../lib/motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  className?: string;
  hover?: boolean;
  children?: React.ReactNode;
}

/**
 * Frosted-glass surface used throughout the app. Forwards arbitrary motion
 * props so callers can drive entry animations; opt into a soft lift via `hover`.
 */
export function GlassCard({
  className,
  hover = false,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? cardHover : undefined}
      className={clsx(
        'rounded-3xl border border-white/10 bg-white/5 shadow-glass backdrop-blur-2xl',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
