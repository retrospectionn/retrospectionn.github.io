import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MODES, type FieldData, type Mode } from './formations';
import { BANDS, fragmentShader, vertexShader } from './shaders';

export interface Palette {
  /** Page background per mode. The canvas is opaque and paints this itself. */
  bgAds: string;
  bgResearch: string;
  bgMaps: string;
  adsLow: string;
  adsHigh: string;
  adsHot: string;
  ink: string;
  inkAccent: string;
  mapLow: string;
  mapHigh: string;
  mapRoad: string;
}

export const DEFAULT_PALETTE: Palette = {
  // Backgrounds must match --bg per mode in styles/tokens.css.
  bgAds: '#0c0e11',
  bgResearch: '#f6f1e7',
  bgMaps: '#0a1310',
  adsLow: '#9a3d0c',
  adsHigh: '#f5a623',
  adsHot: '#fff1d6',
  ink: '#1f1b16',
  inkAccent: '#8a2b1d',
  mapLow: '#1f6b52',
  mapHigh: '#dff7ea',
  mapRoad: '#e2bf6a',
};

/** Camera position and look-at target per mode. */
const POSES: Record<Mode, { position: [number, number, number]; target: [number, number, number] }> = {
  ads: { position: [-5.6, 3.9, 12.4], target: [0.2, 0.2, 0] },
  research: { position: [0, 0.3, 21], target: [0, 0, 0] },
  maps: { position: [0, 6.6, 13.2], target: [0, 0.1, -1.2] },
};

/** Where the formation sits on screen, in NDC (x right, y up), per mode. */
export type Framing = Record<Mode, [number, number]>;

/**
 * Screen-space fades per mode, in NDC: [leftFrom, leftTo, topFrom, topTo].
 * The field fades in from the left between the first pair of x values, and fades out toward
 * the top between the second pair of y values. Use [-3, -2] / [2, 3] to switch a fade off.
 */
export type Masks = Record<Mode, [number, number, number, number]>;

interface FieldProps {
  data: FieldData;
  mode: Mode;
  palette: Palette;
  framing: Framing;
  masks: Masks;
  /** Overall opacity, 0..1. */
  fade: number;
  /** Idle motion and pointer parallax run only while true. */
  lively: boolean;
  reducedMotion: boolean;
}

// Raw sRGB in, raw sRGB out: the shader writes these values unchanged.
const rawColor = (hex: string) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);

export function Field({ data, mode, palette, framing, masks, fade, lively, reducedMotion }: FieldProps) {
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const pixelRatio = useThree((s) => s.viewport.dpr);

  const sim = useRef({
    bands: new Float32Array(BANDS * 3),
    main: new Float32Array(3),
    started: false,
    time: 0,
    pointer: new THREE.Vector2(),
    pointerTarget: new THREE.Vector2(),
    fade: 0,
    position: new THREE.Vector3(),
    target: new THREE.Vector3(),
    shift: new THREE.Vector2(),
    mask: new THREE.Vector4(),
    clear: new THREE.Color(),
  });

  // Ordinary colours (converted by three), in mode order, for the canvas background.
  const backgrounds = useMemo(
    () => [new THREE.Color(palette.bgAds), new THREE.Color(palette.bgResearch), new THREE.Color(palette.bgMaps)],
    [palette.bgAds, palette.bgResearch, palette.bgMaps],
  );

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // "position" is required by three; the shader reads the three formation attributes instead.
    g.setAttribute('position', new THREE.BufferAttribute(data.positions.maps, 3));
    g.setAttribute('aAds', new THREE.BufferAttribute(data.positions.ads, 3));
    g.setAttribute('aResearch', new THREE.BufferAttribute(data.positions.research, 3));
    g.setAttribute('aMaps', new THREE.BufferAttribute(data.positions.maps, 3));
    g.setAttribute('aValue', new THREE.BufferAttribute(data.value, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(data.size, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(data.seed, 2));
    return g;
  }, [data]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneMinusSrcAlphaFactor,
        blendSrcAlpha: THREE.OneFactor,
        blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
        uniforms: {
          uTime: { value: 0 },
          uBands: { value: new Float32Array(BANDS * 3) },
          uPixelRatio: { value: 1 },
          uPointScale: { value: 1 },
          uShift: { value: new THREE.Vector2() },
          uMask: { value: new THREE.Vector4(-3, -2, 2, 3) },
          uFade: { value: 0 },
          uAdsLow: { value: new THREE.Color() },
          uAdsHigh: { value: new THREE.Color() },
          uAdsHot: { value: new THREE.Color() },
          uInk: { value: new THREE.Color() },
          uInkAccent: { value: new THREE.Color() },
          uMapLow: { value: new THREE.Color() },
          uMapHigh: { value: new THREE.Color() },
          uMapRoad: { value: new THREE.Color() },
        },
      }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const u = material.uniforms;
    u.uAdsLow!.value.copy(rawColor(palette.adsLow));
    u.uAdsHigh!.value.copy(rawColor(palette.adsHigh));
    u.uAdsHot!.value.copy(rawColor(palette.adsHot));
    u.uInk!.value.copy(rawColor(palette.ink));
    u.uInkAccent!.value.copy(rawColor(palette.inkAccent));
    u.uMapLow!.value.copy(rawColor(palette.mapLow));
    u.uMapHigh!.value.copy(rawColor(palette.mapHigh));
    u.uMapRoad!.value.copy(rawColor(palette.mapRoad));
    invalidate();
  }, [palette, material, invalidate]);

  // Anything that changes the picture asks for a frame (the loop may be on demand).
  useEffect(() => invalidate(), [mode, fade, framing, masks, lively, size, invalidate]);

  useEffect(() => {
    if (!lively || reducedMotion) {
      sim.current.pointerTarget.set(0, 0);
      return;
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      sim.current.pointerTarget.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [lively, reducedMotion]);

  useFrame((state, rawDelta) => {
    const s = sim.current;
    const dt = Math.min(rawDelta, 0.05);
    const target = MODES.indexOf(mode);
    if (!s.started && !reducedMotion) {
      // First frame: start as a loose cloud (an even mix of all three formations) and let it
      // settle into the current one. Seen once per visit. The camera starts in place.
      s.bands.fill(1 / 3);
      for (let m = 0; m < 3; m++) s.main[m] = m === target ? 1 : 0;
    }
    const snap = reducedMotion;

    // Mode weights. Exponential approach = fast start, soft landing, and it can be
    // redirected at any moment without a jump.
    let unsettled = 0;
    for (let b = 0; b < BANDS; b++) {
      const rate = 5.4 - (3.2 * b) / (BANDS - 1); // leaders ≈ 0.8 s, stragglers ≈ 2 s
      const k = snap ? 1 : 1 - Math.exp(-dt * rate);
      for (let m = 0; m < 3; m++) {
        const goal = m === target ? 1 : 0;
        const i = b * 3 + m;
        s.bands[i]! += (goal - s.bands[i]!) * k;
        unsettled = Math.max(unsettled, Math.abs(goal - s.bands[i]!));
      }
    }
    const kMain = snap ? 1 : 1 - Math.exp(-dt * 3.4);
    let mainSum = 0;
    for (let m = 0; m < 3; m++) {
      s.main[m]! += ((m === target ? 1 : 0) - s.main[m]!) * kMain;
      mainSum += s.main[m]!;
    }

    // Fade follows its target quickly; pointer parallax is damped, never direct.
    const kFade = snap ? 1 : 1 - Math.exp(-dt * 6);
    s.fade += (fade - s.fade) * kFade;
    unsettled = Math.max(unsettled, Math.abs(fade - s.fade));
    const kPointer = 1 - Math.exp(-dt * 2.4);
    s.pointer.x += (s.pointerTarget.x - s.pointer.x) * kPointer;
    s.pointer.y += (s.pointerTarget.y - s.pointer.y) * kPointer;

    if (lively && !reducedMotion) s.time += dt;

    // Camera pose and on-screen placement, blended with the same weights.
    s.position.set(0, 0, 0);
    s.target.set(0, 0, 0);
    s.shift.set(0, 0);
    s.mask.set(0, 0, 0, 0);
    s.clear.setRGB(0, 0, 0);
    for (let m = 0; m < 3; m++) {
      const w = s.main[m]! / Math.max(mainSum, 0.0001);
      const mk = MODES[m]!;
      const bg = backgrounds[m]!;
      const pose = POSES[mk];
      s.clear.r += bg.r * w;
      s.clear.g += bg.g * w;
      s.clear.b += bg.b * w;
      s.position.x += pose.position[0] * w;
      s.position.y += pose.position[1] * w;
      s.position.z += pose.position[2] * w;
      s.target.x += pose.target[0] * w;
      s.target.y += pose.target[1] * w;
      s.target.z += pose.target[2] * w;
      s.shift.x += framing[mk][0] * w;
      s.shift.y += framing[mk][1] * w;
      const mask = masks[mk];
      s.mask.x += mask[0] * w;
      s.mask.y += mask[1] * w;
      s.mask.z += mask[2] * w;
      s.mask.w += mask[3] * w;
    }
    const sway = lively && !reducedMotion ? Math.sin(s.time * 0.12) * 0.25 : 0;
    state.camera.position.set(s.position.x + s.pointer.x * 0.5 + sway, s.position.y - s.pointer.y * 0.28, s.position.z);
    state.camera.lookAt(s.target);
    // The canvas paints the page background itself, so the glow is blended inside WebGL
    // and never depends on how the browser composites a see-through canvas.
    state.gl.setClearColor(s.clear, 1);

    const u = material.uniforms;
    u.uTime!.value = s.time;
    (u.uBands!.value as Float32Array).set(s.bands);
    u.uPixelRatio!.value = pixelRatio;
    const fov = (state.camera as THREE.PerspectiveCamera).fov;
    u.uPointScale!.value = state.size.height / (2 * Math.tan((fov * Math.PI) / 360));
    u.uShift!.value.copy(s.shift);
    u.uMask!.value.copy(s.mask);
    u.uFade!.value = s.fade;

    s.started = true;
    // On a demand loop, keep asking for frames until everything has come to rest.
    if (unsettled > 0.0015 || Math.abs(s.pointerTarget.x - s.pointer.x) + Math.abs(s.pointerTarget.y - s.pointer.y) > 0.002) {
      invalidate();
    }
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
