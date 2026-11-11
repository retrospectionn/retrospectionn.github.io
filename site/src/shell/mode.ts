// Mode store and path-based routing. No router library (PLAN section 5, "Routing").
// The mode comes from the first path segment; anything unknown falls back to Ads.
import { useSyncExternalStore } from 'react';
import { modeMeta } from '../content/profile';
import type { Mode } from '../content/types';

export const MODES: Mode[] = ['ads', 'research', 'maps'];

export function modeFromPath(pathname: string): Mode {
  const first = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
  return first === 'research' || first === 'maps' ? first : 'ads';
}

/** Canonical path for each mode. Ads also answers at "/". */
export function pathForMode(mode: Mode): string {
  return `/${mode}/`;
}

type Listener = () => void;
const listeners = new Set<Listener>();
let current: Mode =
  typeof window === 'undefined' ? 'ads' : modeFromPath(window.location.pathname);

/** How the last change happened, so the toggle can skip its slide for keyboard input. */
let lastInput: 'pointer' | 'keyboard' | 'history' | 'initial' = 'initial';

function applyDocument(mode: Mode) {
  const root = document.documentElement;
  root.dataset.mode = mode;
  const meta = modeMeta[mode];
  document.title = meta.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[mode]);
}

/** Browser UI colour per mode; matches --bg in styles/tokens.css and THEME in postbuild.mjs. */
const THEME_COLOR: Record<Mode, string> = { ads: '#0c0e11', research: '#f6f1e7', maps: '#0a1310' };

function emit() {
  for (const l of listeners) l();
}

export function setMode(mode: Mode, input: 'pointer' | 'keyboard' | 'history') {
  if (mode === current) return;
  current = mode;
  lastInput = input;
  applyDocument(mode);
  if (input !== 'history') {
    const target = pathForMode(mode);
    if (window.location.pathname !== target) {
      window.history.pushState({ mode }, '', target);
    }
  }
  emit();
}

export function getLastInput() {
  return lastInput;
}

let started = false;
/** Call once on boot: syncs <html data-mode> and listens for back/forward. */
export function startRouting() {
  if (started) return;
  started = true;
  applyDocument(current);
  window.addEventListener('popstate', () => {
    setMode(modeFromPath(window.location.pathname), 'history');
  });
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useMode(): Mode {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
