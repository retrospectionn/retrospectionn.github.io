// Mount point for the 3D particle field: a fixed, full-viewport layer behind all content
// (z-index 0, pointer-events none). three.js is loaded only after the page has painted,
// so text is readable before the canvas exists. Without WebGL, Scene renders nothing and
// the body background shows instead.
import { lazy, Suspense, useEffect, useState } from 'react';
import type { Mode } from '../content/types';

const Scene = lazy(() => import('./Scene'));

// Opacity of the field at the top of the page and once the reader has scrolled past the hero.
// Research is a reading page, so the field stays a quiet watermark there.
const FADE: Record<Mode, { top: number; rest: number }> = {
  ads: { top: 1, rest: 0.3 },
  research: { top: 0.85, rest: 0.1 },
  maps: { top: 1, rest: 0.3 },
};

export function SceneSlot({ mode }: { mode: Mode }) {
  const [load, setLoad] = useState(false);
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = idle(() => setLoad(true));
    return () => cancel(id as number);
  }, []);

  // The field is lively while the hero is on screen; past it, it dims and holds still.
  useEffect(() => {
    const update = () => setAtTop(window.scrollY < window.innerHeight * 0.6);
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // Lets CSS swap static stand-ins (such as the Maps hero motif) for the live field,
  // and lets the footer credit the terrain only when the real one is on screen.
  const onReady = (realTerrain: boolean) => {
    document.documentElement.dataset.scene = realTerrain ? 'terrain' : 'procedural';
  };

  return (
    <div className="scene-slot" data-scene-mode={mode} aria-hidden="true">
      {load && (
        <Suspense fallback={null}>
          <Scene mode={mode} lively={atTop} fade={atTop ? FADE[mode].top : FADE[mode].rest} onReady={onReady} />
        </Suspense>
      )}
    </div>
  );
}
