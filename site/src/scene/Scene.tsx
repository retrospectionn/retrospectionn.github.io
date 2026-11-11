import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Field, DEFAULT_PALETTE, type Framing, type Masks, type Palette } from './Field';
import { buildField, type FieldData, type Mode } from './formations';
import { loadGeodata } from './geodata';

export type { Mode } from './formations';
export type { Palette, Framing, Masks } from './Field';

export interface SceneProps {
  mode: Mode;
  /**
   * True while the hero is on screen. The field then drifts, follows the pointer and
   * renders every frame; otherwise it holds still and renders only when something changes.
   */
  lively?: boolean;
  /** Overall opacity 0..1. Lower it once the reader is past the hero. */
  fade?: number;
  palette?: Partial<Palette>;
  /** Told once the field is built, and whether Maps uses the real terrain (false = procedural stand-in). */
  onReady?: (realTerrain: boolean) => void;
}

function webglAvailable(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

// Where each formation sits and where it fades out, tuned against the three page layouts.
// Wide screens: text is on the left, so the field sits right and fades in from the left.
const WIDE: { framing: Framing; masks: Masks } = {
  framing: { ads: [0.36, -0.02], research: [0.6, 0.42], maps: [0.24, 0.3] },
  masks: {
    ads: [-0.04, 0.24, 2, 3],
    research: [0.02, 0.34, 2, 3],
    maps: [-0.14, 0.22, 2, 3],
  },
};
// Narrow screens: text fills the width, so the field sits low and fades out toward the top.
const NARROW: { framing: Framing; masks: Masks } = {
  framing: { ads: [0, -0.34], research: [0, -0.3], maps: [0, -0.3] },
  masks: {
    ads: [-3, -2, -0.5, 0.05],
    research: [-3, -2, -0.5, 0.05],
    maps: [-3, -2, -0.5, 0.05],
  },
};

export default function Scene({ mode, lively = true, fade = 1, palette, onReady }: SceneProps) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const narrow = useMediaQuery('(max-width: 820px)');
  const [supported] = useState(webglAvailable);
  const [data, setData] = useState<FieldData | null>(null);

  // Fewer points on small or modest devices. Decided once; the field is not rebuilt on resize.
  const [quality] = useState(() => {
    const small = window.matchMedia('(max-width: 820px)').matches;
    const cores = navigator.hardwareConcurrency ?? 4;
    return small || cores <= 4 ? { gridN: 120, maxRoadPoints: 3600 } : { gridN: 200, maxRoadPoints: 9000 };
  });

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    void loadGeodata(import.meta.env.BASE_URL).then((geo) => {
      if (cancelled) return;
      const field = buildField(geo, quality);
      setData(field);
      onReady?.(field.realTerrain);
    });
    return () => {
      cancelled = true;
    };
    // onReady is read once on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, quality]);

  const mergedPalette = useMemo(() => ({ ...DEFAULT_PALETTE, ...palette }), [palette]);
  const layout = narrow ? NARROW : WIDE;

  if (!supported) return null;

  return (
    <Canvas
      flat
      dpr={[1, 1.75]}
      frameloop={lively && !reducedMotion ? 'always' : 'demand'}
      gl={{ alpha: false, antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: 32, near: 0.1, far: 60, position: [0, 3, 12] }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {data && (
        <Field
          data={data}
          mode={mode}
          palette={mergedPalette}
          framing={layout.framing}
          masks={layout.masks}
          fade={fade}
          lively={lively}
          reducedMotion={reducedMotion}
        />
      )}
    </Canvas>
  );
}
