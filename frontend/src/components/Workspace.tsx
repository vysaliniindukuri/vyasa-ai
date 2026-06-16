import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trash2 } from 'lucide-react';
import type { ApiError } from '../types';
import { fadeInUp, fadeIn, EASE } from '../lib/motion';
import { GradientButton } from './GradientButton';
import { NoteInput } from './NoteInput';
import { Loader } from './Loader';
import { AlertCard } from './AlertCard';
import { StreamingView } from './StreamingView';

interface WorkspaceProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onGenerate: () => void;
  onClear: () => void;
  generateLabel: string;
  loading: boolean;
  error: ApiError | null;
  toolbar?: ReactNode;
  loaderLabel?: string;
  children?: ReactNode;
  hasResult?: boolean;
  /** Onboarding / informational banner shown above the input panel. */
  notice?: ReactNode;
  /** Live streamed text; when present during loading, shown instead of the loader. */
  partial?: string;
  /** Action row (copy all / export / regenerate) shown above the result. */
  resultToolbar?: ReactNode;
}

/**
 * Shared page scaffold: animated header, optional notice, glass input panel with
 * optional toolbar and the generate/clear actions, then the output region
 * (error, live stream, loader, or the page's result `children`).
 */
export function Workspace({
  title,
  subtitle,
  icon,
  value,
  onChange,
  placeholder,
  onGenerate,
  onClear,
  generateLabel,
  loading,
  error,
  toolbar,
  loaderLabel,
  children,
  hasResult = false,
  notice,
  partial,
  resultToolbar,
}: WorkspaceProps) {
  const canClear = value.length > 0 || hasResult;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.header
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 text-accent-blue ring-1 ring-inset ring-white/10">
              {icon}
            </span>
          )}
          <h1 className="bg-gradient-to-r from-accent-blue via-accent-indigo to-accent-purple bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            {title}
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-white/50 sm:text-base">
          {subtitle}
        </p>
      </motion.header>

      {notice}

      {/* Input panel */}
      <motion.section
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-2xl sm:p-6"
      >
        {toolbar && <div className="flex flex-wrap gap-3">{toolbar}</div>}

        <NoteInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onSubmit={onGenerate}
        />

        <div className="flex flex-wrap items-center gap-3">
          <GradientButton
            variant="primary"
            onClick={onGenerate}
            loading={loading}
            icon={<Sparkles className="h-4 w-4" />}
          >
            {generateLabel}
          </GradientButton>
          <GradientButton
            variant="ghost"
            onClick={onClear}
            disabled={loading || !canClear}
            icon={<Trash2 className="h-4 w-4" />}
          >
            Clear
          </GradientButton>
        </div>
      </motion.section>

      {/* Output region */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="show"
        className="min-h-[8rem]"
      >
        {error ? (
          <AlertCard
            message={error.message}
            tone={error.code === 'empty' ? 'warning' : 'error'}
            onRetry={error.code === 'empty' ? undefined : onGenerate}
          />
        ) : loading ? (
          partial && partial.trim() ? (
            <StreamingView content={partial} label={loaderLabel} />
          ) : (
            <Loader label={loaderLabel} />
          )
        ) : (
          <>
            {hasResult && resultToolbar}
            {children}
          </>
        )}
      </motion.section>
    </motion.div>
  );
}
