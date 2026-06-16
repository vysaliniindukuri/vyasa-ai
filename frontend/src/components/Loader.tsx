import { motion } from 'framer-motion';

interface LoaderProps {
  label?: string;
}

const dotTransition = (delay: number) => ({
  duration: 1.1,
  repeat: Infinity,
  ease: 'easeInOut' as const,
  delay,
});

/**
 * Elegant pulsing loader: a soft gradient ring backing three breathing dots,
 * with an optional caption.
 */
export function Loader({ label = 'Crafting your output…' }: LoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center gap-6 py-20"
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-blue/30 to-accent-purple/30 blur-xl"
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="absolute inset-0 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-accent-blue to-accent-purple"
              animate={{ y: [0, -7, 0], opacity: [0.6, 1, 0.6] }}
              transition={dotTransition(i * 0.16)}
            />
          ))}
        </div>
      </div>
      <p className="text-sm font-medium text-white/55">{label}</p>
    </motion.div>
  );
}
