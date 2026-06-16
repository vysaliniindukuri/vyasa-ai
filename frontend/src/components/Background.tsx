import { motion } from 'framer-motion';

/**
 * Fixed full-screen ambient backdrop: slow-floating gradient blobs that sit
 * behind all content. Purely decorative and non-interactive.
 */
export function Background() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Top-left blue blob */}
      <motion.div
        className="absolute -left-32 -top-40 h-[36rem] w-[36rem] rounded-full bg-accent-blue/25 blur-3xl"
        animate={{ y: [0, -40, 0], x: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Top-right purple blob */}
      <motion.div
        className="absolute -right-40 top-10 h-[40rem] w-[40rem] rounded-full bg-accent-purple/20 blur-3xl"
        animate={{ y: [0, 50, 0], x: [0, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Bottom-center indigo blob */}
      <motion.div
        className="absolute bottom-[-12rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-accent-indigo/20 blur-3xl"
        animate={{ y: [0, -30, 0], x: [0, 40, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Soft pink accent, very subtle */}
      <motion.div
        className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-accent-pink/10 blur-3xl"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
