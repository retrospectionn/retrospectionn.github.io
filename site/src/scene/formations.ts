// Builds the three target formations the particle field moves between.
// Every formation has the same number of points; point i in one formation becomes
// point i in the next, so each is sorted west→east to keep the flight paths short.

import { sampleDem, type Dem, type Geodata } from './geodata';

export const MODES = ['ads', 'research', 'maps'] as const;
export type Mode = (typeof MODES)[number];

export interface FieldData {
  count: number;
  positions: Record<Mode, Float32Array>;
  /** vec3 per point: one colour-ramp value per formation (meaning is per formation, see shader). */
  value: Float32Array;
  /** vec3 per point: world-space point size per formation. */
  size: Float32Array;
  /** vec2 per point: x = random 0..1, y = lag 0..1 (0 moves first, 1 moves last). */
  seed: Float32Array;
  /** True when the Maps formation is real Islamabad terrain, false when it is procedural. */
  realTerrain: boolean;
}

interface Formation {
  pos: Float32Array;
  val: Float32Array;
  size: Float32Array;
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number) {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

function alloc(count: number): Formation {
  return { pos: new Float32Array(count * 3), val: new Float32Array(count), size: new Float32Array(count) };
}

/** Reorders a formation west→east (then by depth) so index-matched points travel short distances. */
function sortWestToEast(f: Formation, count: number): Formation {
  const keys = new Float64Array(count);
  const order = new Uint32Array(count);
  for (let i = 0; i < count; i++) {
    order[i] = i;
    const xb = Math.floor(((f.pos[i * 3]! + 8) / 16) * 72);
    const zb = Math.floor(((f.pos[i * 3 + 2]! + 8) / 16) * 72);
    keys[i] = xb * 4096 + zb;
  }
  order.sort((a, b) => keys[a]! - keys[b]!);
  const out = alloc(count);
  for (let i = 0; i < count; i++) {
    const s = order[i]!;
    out.pos[i * 3] = f.pos[s * 3]!;
    out.pos[i * 3 + 1] = f.pos[s * 3 + 1]!;
    out.pos[i * 3 + 2] = f.pos[s * 3 + 2]!;
    out.val[i] = f.val[s]!;
    out.size[i] = f.size[s]!;
  }
  return out;
}

// ---------------------------------------------------------------- Maps ----

/** World footprint of the terrain. The baked area is about 31.4 km × 28.8 km. */
export const TERRAIN = { width: 13, depth: 11.9, height: 1.9, lift: -0.55 };

function proceduralHeight(u: number, v: number): number {
  // Ridged value noise, only used if the baked terrain fails to load.
  let amp = 0.5;
  let freq = 2.2;
  let sum = 0;
  for (let o = 0; o < 4; o++) {
    const n = Math.sin(u * freq * 6.1 + o * 1.7) * Math.cos(v * freq * 5.3 - o * 2.3);
    sum += (1 - Math.abs(n)) * amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  const northBias = Math.pow(1 - v, 1.6);
  return Math.min(1, Math.max(0, sum * northBias * 1.25));
}

function buildMaps(count: number, gridN: number, geo: Geodata, rand: () => number): Formation {
  const f = alloc(count);
  const { dem, roads } = geo;
  const heightAt = (u: number, v: number) => (dem ? sampleDem(dem as Dem, u, v) : proceduralHeight(u, v));
  const terrainCount = Math.min(count, gridN * gridN);
  const cell = 1 / (gridN - 1);

  for (let k = 0; k < terrainCount; k++) {
    const i = k % gridN;
    const j = Math.floor(k / gridN);
    // A little jitter stops the lattice from shimmering against the pixel grid.
    const u = Math.min(1, Math.max(0, i * cell + (rand() - 0.5) * cell * 0.3));
    const v = Math.min(1, Math.max(0, j * cell + (rand() - 0.5) * cell * 0.3));
    const h = heightAt(u, v);
    f.pos[k * 3] = (u - 0.5) * TERRAIN.width;
    f.pos[k * 3 + 1] = h * TERRAIN.height + TERRAIN.lift;
    f.pos[k * 3 + 2] = (v - 0.5) * TERRAIN.depth;
    f.val[k] = h; // 0..1 = elevation
    f.size[k] = 0.03;
  }

  const roadCount = count - terrainCount;
  for (let k = 0; k < roadCount; k++) {
    const idx = terrainCount + k;
    let u: number;
    let v: number;
    let cls = 0.5;
    if (roads && roads.count > 0) {
      const r = Math.floor((k * roads.count) / roadCount) * 3;
      u = roads.data[r]! / 65535;
      v = roads.data[r + 1]! / 65535;
      cls = roads.data[r + 2]! / 65535;
    } else {
      u = rand();
      v = rand();
    }
    const h = heightAt(u, v);
    f.pos[idx * 3] = (u - 0.5) * TERRAIN.width;
    f.pos[idx * 3 + 1] = h * TERRAIN.height + TERRAIN.lift + 0.012;
    f.pos[idx * 3 + 2] = (v - 0.5) * TERRAIN.depth;
    // 2..3 marks a road point; the fraction is the road class. Without road data these
    // points fall back to plain terrain so nothing is drawn that is not real.
    f.val[idx] = roads && roads.count > 0 ? 2 + cls : h;
    f.size[idx] = roads && roads.count > 0 ? 0.03 + cls * 0.022 : 0.03;
  }
  return f;
}

// ----------------------------------------------------------------- Ads ----

function buildAds(count: number, rand: () => number): Formation {
  const f = alloc(count);
  const COLS = 24;
  const ROWS = 5;
  const pitchX = 0.52;
  const pitchZ = 1.05;
  const half = 0.16;
  const lift = -1.35;
  const RING_GAP = 0.26;
  // One smooth curve drives both the columns and the trend line: steady growth with a
  // lift toward the end of each twelve-column "year".
  const growth = (s: number) => {
    const season = 0.5 - 0.5 * Math.cos(s * (COLS / 12) * Math.PI * 2 - 0.9);
    return (0.2 + 2.7 * Math.pow(s, 1.3)) * (1 + 0.22 * season * season);
  };

  // Column heights: growth left→right, a fourth-quarter peak every twelve columns,
  // taller toward the back so every row stays visible from the camera.
  const heights: number[] = [];
  let maxH = 0;
  let weightSum = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const rowScale = 0.4 + 0.6 * (r / (ROWS - 1));
      const h = Math.max(0.12, growth(c / (COLS - 1)) * rowScale * (0.86 + 0.28 * rand()));
      heights.push(h);
      maxH = Math.max(maxH, h);
      weightSum += h + 0.25;
    }
  }

  const groundCount = Math.floor(count * 0.08);
  const ribbonCount = Math.floor(count * 0.05);
  const barCount = count - groundCount - ribbonCount;
  let k = 0;

  // Columns
  let assigned = 0;
  for (let b = 0; b < heights.length; b++) {
    const r = Math.floor(b / COLS);
    const c = b % COLS;
    const h = heights[b]!;
    const share = b === heights.length - 1 ? barCount - assigned : Math.round((barCount * (h + 0.25)) / weightSum);
    const n = Math.max(0, Math.min(share, barCount - assigned));
    assigned += n;
    const cx = (c - (COLS - 1) / 2) * pitchX;
    const cz = ((ROWS - 1) / 2 - r) * pitchZ; // r = 0 is nearest the camera (+z), tallest rows at the back
    const rings = Math.max(1, Math.floor(h / RING_GAP));
    for (let i = 0; i < n; i++, k++) {
      // A point on the square outline of the column…
      const q = rand() * 4;
      const t = (q % 1) * 2 - 1;
      const side = Math.floor(q);
      let x = side === 0 || side === 2 ? t * half : side === 1 ? half : -half;
      let z = side === 1 || side === 3 ? t * half : side === 0 ? half : -half;
      let y: number;
      let hot = 0;
      let pointSize = 0.027;
      const pick = rand();
      if (pick < 0.24) {
        // …on the top rim, which is what makes each column read as a bar.
        y = h;
        hot = 0.22;
        pointSize = 0.032;
      } else if (pick < 0.32) {
        // …or filling the top face.
        x = (rand() * 2 - 1) * half;
        z = (rand() * 2 - 1) * half;
        y = h;
        hot = 0.12;
        pointSize = 0.026;
      } else if (pick < 0.78) {
        // …or on one of the four vertical edges.
        x = x >= 0 ? half : -half;
        z = z >= 0 ? half : -half;
        y = rand() * h;
      } else {
        // …or on a horizontal ring, like gridlines up the bar.
        y = (1 + Math.floor(rand() * rings)) * RING_GAP;
        if (y > h) y = h;
        pointSize = 0.018;
      }
      f.pos[k * 3] = cx + x;
      f.pos[k * 3 + 1] = y + lift;
      f.pos[k * 3 + 2] = cz + z;
      // 0.1..1 = height along the ramp; the rim sits a little hotter.
      f.val[k] = Math.min(1, 0.1 + 0.78 * (y / maxH) + hot);
      f.size[k] = pointSize;
    }
  }

  // Floor grid
  const spanX = (COLS * pitchX) / 2 + 0.6;
  const spanZ = (ROWS * pitchZ) / 2 + 0.6;
  for (let i = 0; i < groundCount; i++, k++) {
    if (rand() < 0.5) {
      const line = Math.round((rand() * 2 - 1) * (spanX / pitchX)) * pitchX;
      f.pos[k * 3] = line;
      f.pos[k * 3 + 2] = (rand() * 2 - 1) * spanZ;
    } else {
      const line = Math.round((rand() * 2 - 1) * (spanZ / pitchZ)) * pitchZ;
      f.pos[k * 3] = (rand() * 2 - 1) * spanX;
      f.pos[k * 3 + 2] = line;
    }
    f.pos[k * 3 + 1] = lift;
    f.val[k] = 0; // 0 = floor
    f.size[k] = 0.02;
  }

  // Trend line above the back row
  for (let i = 0; i < ribbonCount; i++, k++) {
    const s = rand();
    f.pos[k * 3] = (s - 0.5) * (COLS - 1) * pitchX;
    f.pos[k * 3 + 1] = growth(s) + 0.5 + lift + gaussian(rand) * 0.008;
    f.pos[k * 3 + 2] = -((ROWS - 1) / 2) * pitchZ - 0.55 + gaussian(rand) * 0.008;
    f.val[k] = 2; // 2 = trend line
    f.size[k] = 0.022;
  }

  return f;
}

// ------------------------------------------------------------ Research ----

function buildResearch(count: number, rand: () => number): Formation {
  const f = alloc(count);
  interface Node {
    x: number;
    y: number;
    z: number;
    r: number;
    cluster: number;
    hub: boolean;
  }
  const nodes: Node[] = [];
  const hubs: number[] = [];
  const CLUSTERS = 5;

  for (let c = 0; c < CLUSTERS; c++) {
    const angle = (c / CLUSTERS) * Math.PI * 2 + 0.45;
    const cx = Math.cos(angle) * 4.2;
    const cy = Math.sin(angle) * 2.15;
    const cz = (rand() - 0.5) * 2.6;
    hubs.push(nodes.length);
    nodes.push({ x: cx, y: cy, z: cz, r: 0.17, cluster: c, hub: true });
    const n = 20 + Math.floor(rand() * 7);
    for (let i = 0; i < n; i++) {
      nodes.push({
        x: cx + gaussian(rand) * 1.05,
        y: cy + gaussian(rand) * 0.8,
        z: cz + gaussian(rand) * 0.9,
        r: 0.04 + rand() * 0.05,
        cluster: c,
        hub: false,
      });
    }
  }

  // Edges: two nearest neighbours inside each cluster, some spokes to the hub, hubs joined in a ring.
  const edgeKeys = new Set<string>();
  const edges: Array<{ a: number; b: number; strong: boolean; len: number }> = [];
  const node = (i: number) => nodes[i]!;
  const addEdge = (a: number, b: number, strong: boolean) => {
    if (a === b) return;
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    const len = Math.hypot(node(a).x - node(b).x, node(a).y - node(b).y, node(a).z - node(b).z);
    edges.push({ a, b, strong, len });
  };
  for (let i = 0; i < nodes.length; i++) {
    const near: Array<{ j: number; d: number }> = [];
    for (let j = 0; j < nodes.length; j++) {
      if (j === i || node(j).cluster !== node(i).cluster) continue;
      near.push({ j, d: Math.hypot(node(i).x - node(j).x, node(i).y - node(j).y, node(i).z - node(j).z) });
    }
    near.sort((p, q) => p.d - q.d);
    for (let n = 0; n < Math.min(2, near.length); n++) addEdge(i, near[n]!.j, false);
    if (!node(i).hub && rand() < 0.22) addEdge(i, hubs[node(i).cluster]!, false);
  }
  for (let c = 0; c < CLUSTERS; c++) addEdge(hubs[c]!, hubs[(c + 1) % CLUSTERS]!, true);
  addEdge(hubs[0]!, hubs[2]!, true);
  addEdge(hubs[1]!, hubs[3]!, true);

  const nodeCount = Math.floor(count * 0.42);
  const edgeCount = count - nodeCount;
  let k = 0;

  const nodeWeight = nodes.reduce((s, n) => s + n.r * n.r + 0.002, 0);
  let assigned = 0;
  for (let i = 0; i < nodes.length; i++) {
    const nd = node(i);
    const share = i === nodes.length - 1 ? nodeCount - assigned : Math.round((nodeCount * (nd.r * nd.r + 0.002)) / nodeWeight);
    const n = Math.max(0, Math.min(share, nodeCount - assigned));
    assigned += n;
    for (let p = 0; p < n; p++, k++) {
      const rr = nd.r * Math.cbrt(rand());
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(rand() * 2 - 1);
      f.pos[k * 3] = nd.x + rr * Math.sin(phi) * Math.cos(theta);
      f.pos[k * 3 + 1] = nd.y + rr * Math.sin(phi) * Math.sin(theta);
      f.pos[k * 3 + 2] = nd.z + rr * Math.cos(phi);
      f.val[k] = nd.hub ? 2 : 1; // 1 = node, 2 = hub
      f.size[k] = 0.028;
    }
  }

  const edgeWeight = edges.reduce((s, e) => s + e.len * (e.strong ? 1.6 : 1), 0);
  assigned = 0;
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i]!;
    const share = i === edges.length - 1 ? edgeCount - assigned : Math.round((edgeCount * e.len * (e.strong ? 1.6 : 1)) / edgeWeight);
    const n = Math.max(0, Math.min(share, edgeCount - assigned));
    assigned += n;
    const a = node(e.a);
    const b = node(e.b);
    for (let p = 0; p < n; p++, k++) {
      const t = rand();
      f.pos[k * 3] = a.x + (b.x - a.x) * t + gaussian(rand) * 0.005;
      f.pos[k * 3 + 1] = a.y + (b.y - a.y) * t + gaussian(rand) * 0.005;
      f.pos[k * 3 + 2] = a.z + (b.z - a.z) * t + gaussian(rand) * 0.005;
      f.val[k] = e.strong ? 0.6 : 0.35; // below 1 = edge
      f.size[k] = e.strong ? 0.02 : 0.016;
    }
  }
  // Any rounding remainder lands on the first hub so no point is left at the origin.
  for (; k < count; k++) {
    f.pos[k * 3] = node(0).x;
    f.pos[k * 3 + 1] = node(0).y;
    f.pos[k * 3 + 2] = node(0).z;
    f.val[k] = 2;
    f.size[k] = 0.028;
  }
  return f;
}

// ------------------------------------------------------------- Assemble ----

export interface BuildOptions {
  /** Terrain grid resolution per side. 200 on desktop, about 120 on small devices. */
  gridN: number;
  /** Upper bound on road points. */
  maxRoadPoints: number;
}

export function buildField(geo: Geodata, opts: BuildOptions): FieldData {
  const roadPoints = geo.roads ? Math.min(geo.roads.count, opts.maxRoadPoints) : 0;
  const count = opts.gridN * opts.gridN + roadPoints;

  const maps = sortWestToEast(buildMaps(count, opts.gridN, geo, mulberry32(1947)), count);
  const ads = sortWestToEast(buildAds(count, mulberry32(2024)), count);
  const research = sortWestToEast(buildResearch(count, mulberry32(2020)), count);

  const value = new Float32Array(count * 3);
  const size = new Float32Array(count * 3);
  const seed = new Float32Array(count * 2);
  const rand = mulberry32(7);
  for (let i = 0; i < count; i++) {
    value[i * 3] = ads.val[i]!;
    value[i * 3 + 1] = research.val[i]!;
    value[i * 3 + 2] = maps.val[i]!;
    size[i * 3] = ads.size[i]!;
    size[i * 3 + 1] = research.size[i]!;
    size[i * 3 + 2] = maps.size[i]!;
    seed[i * 2] = rand();
    // The change sweeps west→east with some scatter.
    seed[i * 2 + 1] = Math.min(1, Math.max(0, 0.55 * (i / count) + 0.45 * rand()));
  }

  return {
    count,
    positions: { ads: ads.pos, research: research.pos, maps: maps.pos },
    value,
    size,
    seed,
    realTerrain: geo.dem !== null,
  };
}
