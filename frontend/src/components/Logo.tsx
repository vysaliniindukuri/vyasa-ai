import { Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface LogoProps {
  collapsed?: boolean;
}

/**
 * App mark: a gradient rounded-square glyph plus the "Smart Meeting" wordmark.
 * When `collapsed`, only the glyph is shown (icon-rail layout).
 */
export function Logo({ collapsed = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue via-accent-indigo to-accent-purple shadow-glow">
        <Sparkles className="h-5 w-5 text-white" strokeWidth={2.25} />
        <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
      </div>
      {!collapsed && (
        <div className={clsx('leading-tight')}>
          <p className="bg-gradient-to-r from-accent-blue via-accent-indigo to-accent-purple bg-clip-text text-base font-semibold tracking-tight text-transparent">
            Smart Meeting
          </p>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
            Assistant
          </p>
        </div>
      )}
    </div>
  );
}
