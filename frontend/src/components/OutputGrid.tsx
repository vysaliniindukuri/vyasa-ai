import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer } from '../lib/motion';

interface OutputGridProps {
  children: ReactNode;
}

/**
 * Responsive grid wrapper for {@link OutputCard}s. Drives a staggered entry
 * animation across its children.
 */
export function OutputGrid({ children }: OutputGridProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-5 lg:grid-cols-2"
    >
      {children}
    </motion.div>
  );
}
