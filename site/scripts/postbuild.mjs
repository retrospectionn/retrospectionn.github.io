// After `vite build`: write per-mode copies of dist/index.html so direct loads of
// /ads/, /research/ and /maps/ get their own <title>, description, canonical and OG tags, and
// paint the right theme before JS runs (data-mode on <html>). Also writes dist/404.html, which
// is the same app in Ads mode (unknown paths fall back to Ads).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dist = join(root, 'dist');
const meta = JSON.parse(await readFile(join(root, 'src', 'content', 'meta.json'), 'utf8'));

const ORIGIN = 'https://retrospectionn.github.io';
const THEME = { ads: '#0c0e11', research: '#f6f1e7', maps: '#0a1310' };

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function replaceOnce(html, re, value, what) {
  if (!re.test(html)) throw new Error(`postbuild: could not find ${what} in dist/index.html`);
  return html.replace(re, value);
}

function render(template, mode, path) {
  const m = meta.modes[mode];
  const url = `${ORIGIN}${path}`;
  let html = template;
  html = replaceOnce(html, /<html([^>]*?)\sdata-mode="[^"]*"/, `<html$1 data-mode="${mode}"`, 'html[data-mode]');
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(m.title)}</title>`, '<title>');
  html = replaceOnce(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${esc(m.description)}" />`,
    'meta description',
  );
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`, 'canonical');
  html = replaceOnce(
    html,
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    'og:title',
  );
  html = replaceOnce(
    html,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    'og:description',
  );
  html = replaceOnce(html, /<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}" />`, 'og:url');
  html = replaceOnce(
    html,
    /<meta name="theme-color" content="[^"]*"\s*\/?>/,
    `<meta name="theme-color" content="${THEME[mode]}" />`,
    'theme-color',
  );
  // Share cards: one 1200x630 image per mode (scripts/og-images.mjs writes public/og/).
  const image = `${ORIGIN}/og/${mode}.png`;
  const social = [
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(`${meta.siteName}, ${m.role}`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n    ');
  html = replaceOnce(html, /\s*<\/head>/, `\n    ${social}\n  </head>`, '</head>');
  return html;
}

const template = await readFile(join(dist, 'index.html'), 'utf8');

const outputs = [
  ['index.html', 'ads', '/'],
  ['ads/index.html', 'ads', '/ads/'],
  ['research/index.html', 'research', '/research/'],
  ['maps/index.html', 'maps', '/maps/'],
  ['404.html', 'ads', '/'],
];

for (const [file, mode, path] of outputs) {
  const out = join(dist, file);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, render(template, mode, path));
  console.log(`postbuild: ${file} (${mode})`);
}
