// Bakes an anonymous grid of one OpenStreetMap contributor's edits around
// Islamabad/Rawalpindi into public/data/osm-edits.json.
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

const W = 72.75, S = 33.4, E = 73.45, N = 33.9;
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

// 2-5. Download each changeset and collect points.
await mkdir(CACHE, { recursive: true });
const grid = new Map();
const inBox = (lon, lat) => lon >= W && lon <= E && lat >= S && lat <= N;
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
