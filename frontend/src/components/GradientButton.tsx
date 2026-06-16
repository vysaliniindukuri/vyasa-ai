import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

type Variant = 'primary' | 'ghost' | 'danger';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface GradientButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  children: ReactNode;
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-glow transition-shadow',
  ghost:
    'border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white',
  danger:
    'border border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20',
};

/**
 * Primary action button with an accent gradient fill, soft hover glow, a tap
 * ripple, and a built-in loading spinner state.
 */
export function GradientButton({
  children,
  variant = 'primary',
  loading = false,
  icon,
  className,
  disabled,
  onClick,
  type = 'button',
  ...rest
}: GradientButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const isDisabled = disabled || loading;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [
      ...prev,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
    setTimeout(
      () => setRipples((prev) => prev.filter((r) => r.id !== id)),
      650,
    );
    onClick?.(e);
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { scale: 1.03 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      className={clsx(
        'relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-sm font-semibold tracking-tight',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo/60',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="pointer-events-none absolute h-4 w-4 rounded-full bg-white/40"
            style={{ left: r.x, top: r.y }}
            initial={{ scale: 0, opacity: 0.5, x: '-50%', y: '-50%' }}
            animate={{ scale: 26, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      <span className="relative">{children}</span>
    </motion.button>
  );
}
