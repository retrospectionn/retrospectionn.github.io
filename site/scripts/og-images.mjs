// Writes the three 1200×630 Open Graph images to public/og/ from one SVG template, in each
// mode's colours (name + role, no photo). Run with `pnpm og` after changing a role or colour;
// the PNGs are committed so builds never need this.
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const out = join(root, 'public', 'og');
const meta = JSON.parse(await readFile(join(root, 'src', 'content', 'meta.json'), 'utf8'));

// Colours match styles/tokens.css.
const THEMES = {
  ads: { bg: '#0c0e11', text: '#ece8e0', muted: '#a39e94', accent: '#f5a623', line: '#262a31',
    name: "'Segoe UI', Arial, sans-serif", role: "'Segoe UI', Arial, sans-serif", mono: 'Consolas, monospace' },
  research: { bg: '#f6f1e7', text: '#1f1b16', muted: '#5b5247', accent: '#8a2b1d', line: '#ddd3c2',
    name: "Georgia, 'Times New Roman', serif", role: "Georgia, 'Times New Roman', serif", mono: "'Segoe UI', Arial, sans-serif" },
  maps: { bg: '#0a1310', text: '#dfeae3', muted: '#94ab9e', accent: '#8fdcab', line: '#1d3027',
    name: "'Segoe UI', Arial, sans-serif", role: 'Consolas, monospace', mono: 'Consolas, monospace' },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** A quiet motif on the right half, one per mode. Abstract, no data meaning. */
function motif(mode, t) {
  if (mode === 'ads') {
    // Rising columns with a fourth-quarter lift, and a trend line above them.
    const bars = [];
    const pts = [];
    for (let i = 0; i < 12; i++) {
      const s = i / 11;
      const h = 50 + 280 * Math.pow(s, 1.3) * (1 + (i % 4 === 3 ? 0.18 : 0));
      const x = 660 + i * 40;
      bars.push(`<rect x="${x}" y="${520 - h}" width="22" height="${h}" rx="2" fill="${t.accent}" opacity="${0.18 + 0.6 * s}"/>`);
      pts.push(`${x + 11},${520 - h - 36}`);
    }
    return `${bars.join('')}<polyline points="${pts.join(' ')}" fill="none" stroke="${t.text}" stroke-width="2" opacity="0.5"/>`;
  }
  if (mode === 'research') {
    // A small seeded constellation: five clusters joined by thin edges.
    let a = 2020;
    const rand = () => ((a = (a * 1103515245 + 12345) % 2147483648) / 2147483648);
    const nodes = [];
    for (let c = 0; c < 5; c++) {
      const ang = (c / 5) * Math.PI * 2 + 0.4;
      const cx = 955 + Math.cos(ang) * 140;
      const cy = 315 + Math.sin(ang) * 140;
      for (let i = 0; i < 7; i++) nodes.push({ x: cx + (rand() - 0.5) * 90, y: cy + (rand() - 0.5) * 80, hub: i === 0, c });
    }
    const edges = [];
    for (const n of nodes) {
      const near = nodes.filter((m) => m !== n && m.c === n.c).sort((p, q) => Math.hypot(p.x - n.x, p.y - n.y) - Math.hypot(q.x - n.x, q.y - n.y));
      for (const m of near.slice(0, 2)) edges.push(`<line x1="${n.x}" y1="${n.y}" x2="${m.x}" y2="${m.y}"/>`);
    }
    const hubs = nodes.filter((n) => n.hub);
    hubs.forEach((h, i) => { const g = hubs[(i + 1) % hubs.length]; edges.push(`<line x1="${h.x}" y1="${h.y}" x2="${g.x}" y2="${g.y}"/>`); });
    const dots = nodes.map((n) => `<circle cx="${n.x}" cy="${n.y}" r="${n.hub ? 7 : 3.5}" fill="${n.hub ? t.accent : t.text}"/>`);
    return `<g stroke="${t.text}" stroke-width="1.2" opacity="0.35">${edges.join('')}</g><g opacity="0.8">${dots.join('')}</g>`;
  }
  // Maps: contour lines.
  const rings = [];
  for (let i = 0; i < 9; i++) {
    rings.push(`<path d="M ${720 + i * 6} ${590 - i * 24} C ${840 + i * 10} ${470 - i * 28}, ${930 - i * 4} ${620 - i * 26}, ${1040 + i * 8} ${420 - i * 22} S ${1160 - i * 6} ${300 - i * 16}, 1240 ${330 - i * 24}" fill="none" stroke="${i % 4 === 0 ? t.accent : t.muted}" stroke-width="${i % 4 === 0 ? 2.2 : 1.2}" opacity="${i % 4 === 0 ? 0.7 : 0.35}"/>`);
  }
  return rings.join('');
}

function svg(mode) {
  const t = THEMES[mode];
  const m = meta.modes[mode];
  const label = mode === 'maps' ? '33.6844° N · 73.0479° E' : mode === 'research' ? 'Curriculum · Research' : 'Portfolio';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><clipPath id="frame"><rect x="41" y="41" width="1118" height="548" rx="9"/></clipPath></defs>
  <rect width="1200" height="630" fill="${t.bg}"/>
  <g clip-path="url(#frame)">${motif(mode, t)}</g>
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="${t.line}" stroke-width="2" rx="10"/>
  <text x="96" y="170" font-family="${t.mono}" font-size="24" letter-spacing="3" fill="${t.muted}">${esc(label.toUpperCase())}</text>
  <text x="92" y="318" font-family="${t.name}" font-size="104" font-weight="${mode === 'research' ? 400 : 700}" fill="${t.text}">${esc(meta.siteName)}</text>
  <text x="96" y="398" font-family="${t.role}" font-size="46" ${mode === 'research' ? 'font-style="italic"' : 'font-weight="600"'} fill="${t.accent}">${esc(m.role)}</text>
  <text x="96" y="530" font-family="${t.mono}" font-size="24" fill="${t.muted}">retrospectionn.github.io/${mode}/</text>
</svg>`;
}

await mkdir(out, { recursive: true });
for (const mode of Object.keys(THEMES)) {
  const file = join(out, `${mode}.png`);
  await sharp(Buffer.from(svg(mode))).png({ compressionLevel: 9 }).toFile(file);
  console.log(`og: ${file}`);
}
