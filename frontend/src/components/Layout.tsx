import type { ReactNode } from 'react';
import type { ViewId } from '../types';
import { Background } from './Background';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  active: ViewId;
  onSelect: (v: ViewId) => void;
  onOpenHistory: () => void;
  children: ReactNode;
}

/**
 * App shell: ambient background, fixed sidebar, and a scrollable, centered
 * main content column.
 */
export function Layout({ active, onSelect, onOpenHistory, children }: LayoutProps) {
  return (
    <div className="relative flex min-h-screen text-white">
      <Background />
      <Sidebar active={active} onSelect={onSelect} onOpenHistory={onOpenHistory} />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:px-10 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
