// Bakes the Maps-mode geodata into two small binaries. Run once; outputs are committed.
//   <out>/islamabad-dem.bin    Uint16 header [w, h, minMetres, maxMetres] + w*h Uint16 heights (0..65535)
//   <out>/islamabad-roads.bin  Uint16 header [count, 0] + count * [x, z, class] Uint16 (x,z in 0..65535)
// Terrain: AWS Terrain Tiles (terrarium), open data. Roads: OpenStreetMap via Overpass.
// No dependencies: PNG is decoded with Node's zlib.
//
// usage: node bake-dem.mjs <outDir>
import { inflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const OUT = resolve(process.argv[2] ?? './public/data');
const BBOX = { west: 72.9, east: 73.24, south: 33.6, north: 33.86 }; // Islamabad + Margalla Hills
const GRID = 200;
const ZOOM = 12;
const ROAD_POINTS = 9000;
const UA = 'portfolio-terrain-bake/1.0';

// ---------- PNG (8-bit RGB / RGBA, non-interlaced) ----------
function decodePng(buf) {
  let p = 8;
  let width = 0, height = 0, colorType = 0, bitDepth = 0, interlace = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`unsupported PNG: depth ${bitDepth}, colour ${colorType}, interlace ${interlace}`);
  }
  const bpp = colorType === 2 ? 3 : 4;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[dst + x - bpp] : 0;
      const b = y > 0 ? out[dst + x - stride] : 0;
      const c = x >= bpp && y > 0 ? out[dst + x - stride - bpp] : 0;
      let v = raw[src + x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[dst + x] = v & 255;
    }
  }
  return { width, height, bpp, data: out };
}

// ---------- web mercator ----------
const n = 2 ** ZOOM;
const lonToPx = (lon) => ((lon + 180) / 360) * n * 256;
const latToPx = (lat) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n * 256;
};

const tiles = new Map();
async function tile(tx, ty) {
  const key = `${tx}/${ty}`;
  if (!tiles.has(key)) {
    const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${ZOOM}/${tx}/${ty}.png`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`tile ${key}: HTTP ${res.status}`);
    tiles.set(key, decodePng(Buffer.from(await res.arrayBuffer())));
  }
  return tiles.get(key);
}
async function elevationAtPx(px, py) {
  const sample = async (x, y) => {
    const t = await tile(Math.floor(x / 256), Math.floor(y / 256));
    const i = ((y % 256) * t.width + (x % 256)) * t.bpp;
    return t.data[i] * 256 + t.data[i + 1] + t.data[i + 2] / 256 - 32768;
  };
  const x0 = Math.floor(px), y0 = Math.floor(py), fx = px - x0, fy = py - y0;
  const [a, b, c, d] = await Promise.all([sample(x0, y0), sample(x0 + 1, y0), sample(x0, y0 + 1), sample(x0 + 1, y0 + 1)]);
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

// ---------- terrain ----------
async function bakeTerrain() {
  const heights = new Float32Array(GRID * GRID);
  let min = Infinity, max = -Infinity;
  for (let j = 0; j < GRID; j++) {
    const lat = BBOX.north + (BBOX.south - BBOX.north) * (j / (GRID - 1)); // row 0 = north
    for (let i = 0; i < GRID; i++) {
      const lon = BBOX.west + (BBOX.east - BBOX.west) * (i / (GRID - 1));
      const h = await elevationAtPx(lonToPx(lon), latToPx(lat));
      heights[j * GRID + i] = h;
      if (h < min) min = h;
      if (h > max) max = h;
    }
  }
  const out = new Uint16Array(4 + GRID * GRID);
  out[0] = GRID; out[1] = GRID; out[2] = Math.round(min); out[3] = Math.round(max);
  for (let k = 0; k < heights.length; k++) out[4 + k] = Math.round(((heights[k] - min) / (max - min)) * 65535);
  await writeFile(resolve(OUT, 'islamabad-dem.bin'), Buffer.from(out.buffer));
  console.log(`terrain: ${GRID}x${GRID}, ${Math.round(min)}–${Math.round(max)} m, ${tiles.size} tiles, ${out.byteLength} bytes`);
}

// ---------- roads ----------
const CLASS = { motorway: 65535, trunk: 60000, primary: 50000, secondary: 34000 };
async function bakeRoads() {
  const q = `[out:json][timeout:90];way["highway"~"^(motorway|trunk|primary|secondary)$"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});out geom;`;
  let json = null;
  for (const host of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']) {
    try {
      const res = await fetch(host, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(q),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      json = await res.json();
      break;
    } catch (err) {
      console.warn(`overpass ${host}: ${err.message}`);
    }
  }
  if (!json) {
    console.warn('roads: skipped (Overpass unavailable) — writing an empty file');
    await writeFile(resolve(OUT, 'islamabad-roads.bin'), Buffer.from(new Uint16Array([0, 0]).buffer));
    return;
  }
  // Project to a local metric plane so sampling is uniform by distance.
  const kx = Math.cos((((BBOX.north + BBOX.south) / 2) * Math.PI) / 180) * 111320;
  const ky = 110540;
  const segs = [];
  let total = 0;
  for (const way of json.elements) {
    const cls = CLASS[way.tags?.highway];
    if (!cls || !way.geometry) continue;
    for (let i = 1; i < way.geometry.length; i++) {
      const a = way.geometry[i - 1], b = way.geometry[i];
      const len = Math.hypot((b.lon - a.lon) * kx, (b.lat - a.lat) * ky);
      if (len > 0) { segs.push({ a, b, len, cls }); total += len; }
    }
  }
  const step = total / ROAD_POINTS;
  const pts = [];
  let carry = 0;
  for (const s of segs) {
    let d = carry;
    while (d < s.len) {
      const t = d / s.len;
      const lon = s.a.lon + (s.b.lon - s.a.lon) * t;
      const lat = s.a.lat + (s.b.lat - s.a.lat) * t;
      const u = (lon - BBOX.west) / (BBOX.east - BBOX.west);
      const v = (BBOX.north - lat) / (BBOX.north - BBOX.south);
      if (u >= 0 && u <= 1 && v >= 0 && v <= 1) pts.push(Math.round(u * 65535), Math.round(v * 65535), s.cls);
      d += step;
    }
    carry = d - s.len;
  }
  const count = pts.length / 3;
  const out = new Uint16Array(2 + pts.length);
  out[0] = count; out[1] = 0;
  out.set(pts, 2);
  await writeFile(resolve(OUT, 'islamabad-roads.bin'), Buffer.from(out.buffer));
  console.log(`roads: ${json.elements.length} ways, ${(total / 1000).toFixed(0)} km, ${count} points, ${out.byteLength} bytes`);
}

await mkdir(OUT, { recursive: true });
await bakeTerrain();
await bakeRoads();
