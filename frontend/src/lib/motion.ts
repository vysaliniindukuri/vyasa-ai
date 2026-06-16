import type { Variants } from 'framer-motion';

/** Shared Apple-style easing curve (slow ease-out). */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.4, ease: EASE },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE },
  },
};

/** Use with `whileHover` on motion elements for a soft lift. */
export const cardHover = {
  scale: 1.02,
  y: -4,
  transition: { type: 'spring', stiffness: 300, damping: 22 },
} as const;
