import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Tone } from '../types';

interface ToneSelectorProps {
  value: Tone;
  onChange: (t: Tone) => void;
}

const TONES: Array<{ id: Tone; label: string }> = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'executive', label: 'Executive' },
  { id: 'concise', label: 'Concise' },
];

/**
 * Segmented control for picking an email tone. A shared `layoutId` highlight
 * slides between the active pill.
 */
export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Email tone"
      className="inline-flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl"
    >
      {TONES.map(({ id, label }) => {
        const isActive = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(id)}
            className={clsx(
              'relative rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo/60',
              isActive ? 'text-white' : 'text-white/55 hover:text-white/85',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="toneGlow"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent-blue/30 to-accent-purple/30 shadow-glow"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
