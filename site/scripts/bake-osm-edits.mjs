// Bakes an anonymous grid of one OpenStreetMap contributor's edits inside Pakistan
// into public/data/osm-edits.json. Edits outside the country outline are left out.
// Usage: OSM_USER=<display name> node scripts/bake-osm-edits.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const USER = process.env.OSM_USER;
if (!USER) {
  console.error('Usage: OSM_USER=<osm display name> node scripts/bake-osm-edits.mjs');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const SITE = join(here, '..');
const REPO = join(SITE, '..');
const CACHE = join(REPO, '.planning', 'osm-cache');
const OUT = join(SITE, 'public', 'data', 'osm-edits.json');

const W = 60.8, S = 23.5, E = 77.9, N = 37.2; // box around Pakistan
const CELL = 0.0015;
const API = 'https://api.openstreetmap.org/api/0.6';
const HEADERS = { 'User-Agent': 'portfolio-heatmap-bake/1.0' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastRequest = 0;

async function get(url) {
  for (let attempt = 1; ; attempt++) {
    const wait = lastRequest + 200 - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequest = Date.now();
    let status = 0;
    try {
      const res = await fetch(url, { headers: HEADERS });
      status = res.status;
      if (res.ok) return await res.text();
      if (status !== 429 && status < 500) throw new Error(`HTTP ${status} for ${url}`);
    } catch (err) {
      if (status && status !== 429 && status < 500) throw err;
      if (attempt >= 5) throw err;
    }
    if (attempt >= 5) throw new Error(`HTTP ${status} after ${attempt} tries for ${url}`);
    const backoff = 1000 * 2 ** attempt;
    console.warn(`  retry ${attempt} (${status || 'network error'}) in ${backoff} ms`);
    await sleep(backoff);
  }
}

// 1. List changesets intersecting the bbox, paging backwards in time.
const changesets = new Map();
const base = `${API}/changesets.json?display_name=${encodeURIComponent(USER)}&bbox=${W},${S},${E},${N}&limit=100`;
let before = null;
for (;;) {
  const url = before ? `${base}&time=2005-01-01T00:00:00Z,${before}` : base;
  const page = JSON.parse(await get(url)).changesets || [];
  let added = 0;
  for (const cs of page) {
    if (!changesets.has(cs.id)) { changesets.set(cs.id, cs); added++; }
    if (!before || cs.created_at < before) before = cs.created_at;
  }
  console.log(`listed ${changesets.size} changesets`);
  if (!added) break;
}

// Country outline (OpenStreetMap, via Nominatim), cached. Used to keep only edits inside Pakistan.
await mkdir(CACHE, { recursive: true });
const outlineFile = join(CACHE, 'pakistan-outline.json');
if (!existsSync(outlineFile)) {
  await writeFile(outlineFile, await get('https://nominatim.openstreetmap.org/search?country=Pakistan&featuretype=country&polygon_geojson=1&polygon_threshold=0.005&format=json&limit=1'));
}
const geo = JSON.parse(await readFile(outlineFile, 'utf8'))[0].geojson;
const polygons = geo.type === 'Polygon' ? [geo.coordinates] : geo.coordinates;
const inRing = (lon, lat, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const inCountry = (lon, lat) =>
  polygons.some((p) => inRing(lon, lat, p[0]) && !p.slice(1).some((hole) => inRing(lon, lat, hole)));

// A simplified copy of the outline for the page (label filter and the dimmed surround).
const simplify = (pts, tol) => {
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-12;
    let worst = -1, far = 0;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / len;
      if (d > far) { far = d; worst = i; }
    }
    if (far > tol) { keep[worst] = 1; stack.push([a, worst], [worst, b]); }
  }
  return pts.filter((_, i) => keep[i]).map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]);
};
const outer = polygons.map((p) => p[0]).sort((a, b) => b.length - a.length)[0];
const half = Math.floor(outer.length / 2);
const ring = [...simplify(outer.slice(0, half + 1), 0.02), ...simplify(outer.slice(half), 0.02).slice(1)];
const OUTLINE = join(SITE, 'public', 'data', 'pakistan-outline.json');
await writeFile(OUTLINE, JSON.stringify({ type: 'Polygon', coordinates: [ring] }));
console.log(`outline: ${ring.length} points`);

// 2-5. Download each changeset and collect points.
const grid = new Map();
const inBox = (lon, lat) => lon >= W && lon <= E && lat >= S && lat <= N && inCountry(lon, lat);
const add = (lon, lat, n) => {
  const ix = Math.floor((lon - W) / CELL), iy = Math.floor((lat - S) / CELL);
  const k = iy * 100000 + ix;
  grid.set(k, (grid.get(k) || 0) + n);
};

let used = 0, nodes = 0, done = 0;
const ids = [...changesets.keys()];
for (const id of ids) {
  const cs = changesets.get(id);
  const file = join(CACHE, `${id}.xml`);
  let xml;
  if (existsSync(file)) xml = await readFile(file, 'utf8');
  else { xml = await get(`${API}/changeset/${id}/download`); await writeFile(file, xml); }

  let found = 0;
  const blocks = xml.matchAll(/<(create|modify)\b[^>]*>([\s\S]*?)<\/\1>/g);
  for (const [, , body] of blocks) {
    for (const [tag] of body.matchAll(/<node\b[^>]*>/g)) {
      const lat = tag.match(/\slat="([^"]+)"/), lon = tag.match(/\slon="([^"]+)"/);
      if (!lat || !lon) continue;
      const la = +lat[1], lo = +lon[1];
      if (!inBox(lo, la)) continue;
      add(lo, la, 1); found++;
    }
  }
  if (found) { used++; nodes += found; }
  else if (cs.min_lon != null && cs.max_lon - cs.min_lon < 0.02 && cs.max_lat - cs.min_lat < 0.02) {
    const lo = (cs.min_lon + cs.max_lon) / 2, la = (cs.min_lat + cs.max_lat) / 2;
    if (inBox(lo, la)) { add(lo, la, Math.min(cs.changes_count || 1, 5)); used++; }
  }
  if (++done % 50 === 0) console.log(`processed ${done}/${ids.length}`);
}

// 6-7. Write the grid.
const keys = [...grid.keys()].sort((a, b) => a - b);
const cells = [];
let max = 0;
for (const k of keys) {
  const c = grid.get(k);
  cells.push(k % 100000, Math.floor(k / 100000), c);
  if (c > max) max = c;
}
const json = JSON.stringify({ origin: [W, S], cell: CELL, cells });
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, json);

console.log(`changesets used: ${used} of ${ids.length}`);
console.log(`nodes counted:   ${nodes}`);
console.log(`non-empty cells: ${keys.length}`);
console.log(`max cell count:  ${max}`);
console.log(`output size:     ${Buffer.byteLength(json)} bytes`);
