// Loads the baked Islamabad terrain and road files (see scripts/bake-dem.mjs).

export interface Dem {
  w: number;
  h: number;
  minMetres: number;
  maxMetres: number;
  /** Row-major, row 0 = north. Values 0..65535 between minMetres and maxMetres. */
  data: Uint16Array;
}

export interface Roads {
  count: number;
  /** Triples of [x, z, class], each 0..65535. x runs west→east, z runs north→south. */
  data: Uint16Array;
}

export interface Geodata {
  dem: Dem | null;
  roads: Roads | null;
}

async function fetchU16(url: string): Promise<Uint16Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  if (buf.byteLength < 4 || buf.byteLength % 2 !== 0) throw new Error(`${url}: unexpected size`);
  return new Uint16Array(buf);
}

export async function loadGeodata(base: string): Promise<Geodata> {
  const [demRes, roadRes] = await Promise.allSettled([
    fetchU16(`${base}data/islamabad-dem.bin`),
    fetchU16(`${base}data/islamabad-roads.bin`),
  ]);

  let dem: Dem | null = null;
  if (demRes.status === 'fulfilled') {
    const u = demRes.value;
    const w = u[0]!;
    const h = u[1]!;
    if (w > 1 && h > 1 && u.length === 4 + w * h) {
      dem = { w, h, minMetres: u[2]!, maxMetres: u[3]!, data: u.subarray(4) };
    }
  }

  let roads: Roads | null = null;
  if (roadRes.status === 'fulfilled') {
    const u = roadRes.value;
    const count = u[0]!;
    if (count > 0 && u.length === 2 + count * 3) roads = { count, data: u.subarray(2) };
  }

  return { dem, roads };
}

/** Bilinear height lookup, u/v in 0..1, returns 0..1. */
export function sampleDem(dem: Dem, u: number, v: number): number {
  const x = Math.min(Math.max(u, 0), 1) * (dem.w - 1);
  const y = Math.min(Math.max(v, 0), 1) * (dem.h - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, dem.w - 1);
  const y1 = Math.min(y0 + 1, dem.h - 1);
  const fx = x - x0;
  const fy = y - y0;
  const d = dem.data;
  const top = d[y0 * dem.w + x0]! * (1 - fx) + d[y0 * dem.w + x1]! * fx;
  const bot = d[y1 * dem.w + x0]! * (1 - fx) + d[y1 * dem.w + x1]! * fx;
  return (top * (1 - fy) + bot * fy) / 65535;
}
