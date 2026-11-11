import type { MouseEvent, ReactNode } from 'react';
import type { Mode } from '../content/types';
import { pathForMode, setMode } from './mode';

/** A real link to another mode's path that switches in place with pushState. */
export function ModeLink({ mode, children, className }: { mode: Mode; children: ReactNode; className?: string }) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setMode(mode, 'pointer');
  };
  return (
    <a href={pathForMode(mode)} onClick={onClick} className={className}>
      {children}
    </a>
  );
}
