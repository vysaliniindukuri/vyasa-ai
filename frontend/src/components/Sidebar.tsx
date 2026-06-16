import {
  CalendarDays,
  ClipboardList,
  FileText,
  History as HistoryIcon,
  Mail,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { ViewId } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  active: ViewId;
  onSelect: (v: ViewId) => void;
  onOpenHistory: () => void;
}

interface NavItem {
  id: ViewId;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'summary', label: 'Meeting Summary', icon: FileText },
  { id: 'email', label: 'Email Generator', icon: Mail },
  { id: 'daily', label: 'Status Reports', icon: ClipboardList },
  { id: 'weekly', label: 'Weekly Reports', icon: CalendarDays },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/**
 * Left navigation rail. Shows the logo and the five workspaces. Collapses to
 * an icon-only rail below the `md` breakpoint. The active item carries a shared
 * `layoutId` glow that animates between selections.
 */
export function Sidebar({ active, onSelect, onOpenHistory }: SidebarProps) {
  return (
    <aside className="sticky top-0 flex h-screen shrink-0 flex-col gap-4 p-3 md:w-72 md:p-5">
      <div className="rounded-3xl border border-white/10 bg-white/5 px-3 py-4 shadow-glass backdrop-blur-2xl md:px-4">
        <div className="flex justify-center md:justify-start md:px-1">
          {/* Wordmark on md+, glyph-only below */}
          <span className="hidden md:block">
            <Logo />
          </span>
          <span className="md:hidden">
            <Logo collapsed />
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 rounded-3xl border border-white/10 bg-white/5 p-2.5 shadow-glass backdrop-blur-2xl md:p-3">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={clsx(
                'group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors',
                'justify-center md:justify-start',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo/60',
                isActive
                  ? 'text-white'
                  : 'text-white/55 hover:bg-white/5 hover:text-white/90',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="navGlow"
                  className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-r from-accent-blue/25 to-accent-purple/25 shadow-glow"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon
                className={clsx(
                  'relative h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-accent-blue' : 'text-current',
                )}
                strokeWidth={2}
              />
              <span className="relative hidden md:inline">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-2.5 shadow-glass backdrop-blur-2xl md:p-3">
        <button
          type="button"
          onClick={onOpenHistory}
          aria-label="Open history"
          className="group flex w-full items-center justify-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white/90 md:justify-start"
        >
          <HistoryIcon className="h-5 w-5 shrink-0 transition-transform group-hover:-rotate-12" />
          <span className="hidden md:inline">History</span>
        </button>
      </div>
    </aside>
  );
}
