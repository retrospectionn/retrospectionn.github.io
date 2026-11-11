// Refreshes src/content/generated/{medium,github}.json and downloads images into public/media/.
// Run with `pnpm sync`. The output is committed; `pnpm build` never touches the network.
//
// Sources:
//   - Medium RSS: https://medium.com/feed/@CasualVisionary (needs a browser User-Agent)
//   - GitHub public API for user `retrospectionn`
//   - SimYourCity banner: resources/banner.png in retrospectionn/simyourcity
//   - Headshot: https://codeforpakistan.org/media/people/ammaz.jpg
//
// If the Medium feed cannot be fetched, the script falls back to the existing medium.json and
// then to the seed file ../.planning/medium_posts.json (if present), so a failed fetch never
// wipes content.

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const genDir = join(root, 'src', 'content', 'generated');
const mediaDir = join(root, 'public', 'media');
const seedPath = resolve(root, '..', '.planning', 'medium_posts.json');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const FEED = 'https://medium.com/feed/@CasualVisionary';
const GH_USER = 'retrospectionn';
const HEADSHOT = 'https://codeforpakistan.org/media/people/ammaz.jpg';
const MAX_W = 800;
const force = process.argv.includes('--force');

const exists = (p) => access(p).then(() => true, () => false);

async function get(url, accept) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept ?? '*/*' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
}

/** Slug from a Medium post URL: last path segment without the trailing hash id. */
export function slugFromLink(link) {
  const last = new URL(link).pathname.split('/').filter(Boolean).pop() ?? 'post';
  return last.replace(/-[0-9a-f]{8,}$/i, '');
}

// ---------- Medium ----------

const decode = (s) =>
  s
    .replace(/^<!\[CDATA\[|\]\]>$/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .trim();

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : '';
};

function parseFeed(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  return items.map((it) => {
    const link = tag(it, 'link').split('?')[0];
    const content = tag(it, 'content:encoded');
    const img = content.match(/<img[^>]+src="([^"]+)"/)?.[1] ?? null;
    const cats = [...it.matchAll(/<category>([\s\S]*?)<\/category>/g)].map((c) => decode(c[1]));
    return { title: tag(it, 'title'), link, date: tag(it, 'pubDate'), cats, img };
  });
}

async function loadMedium() {
  try {
    const xml = await (await get(FEED, 'application/rss+xml, application/xml')).text();
    const posts = parseFeed(xml);
    if (posts.length) {
      console.log(`medium: ${posts.length} posts from RSS`);
      return posts;
    }
    throw new Error('feed had no items');
  } catch (err) {
    console.warn(`medium: RSS fetch failed (${err.message}); falling back`);
  }
  const current = join(genDir, 'medium.json');
  if (await exists(current)) {
    const data = JSON.parse(await readFile(current, 'utf8'));
    return data.posts.map((p) => ({ ...p, img: p.coverSource }));
  }
  if (await exists(seedPath)) {
    console.log('medium: using seed .planning/medium_posts.json');
    return JSON.parse(await readFile(seedPath, 'utf8'));
  }
  throw new Error('no Medium data available');
}

/** Merge feed posts with the seed so older posts that fell off the RSS window are kept. */
async function withSeed(posts) {
  if (!(await exists(seedPath))) return posts;
  const seed = JSON.parse(await readFile(seedPath, 'utf8'));
  const byLink = new Map(posts.map((p) => [p.link, p]));
  for (const s of seed) if (!byLink.has(s.link)) byLink.set(s.link, s);
  return [...byLink.values()];
}

async function toWebp(url, outName, width = MAX_W) {
  const out = join(mediaDir, outName);
  if (!force && (await exists(out))) return `/media/${outName}`;
  const buf = Buffer.from(await (await get(url, 'image/*')).arrayBuffer());
  // sharp reads only the first frame of an animated GIF unless `animated: true` is set.
  await sharp(buf, { animated: false })
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(out);
  console.log(`media: wrote ${outName}`);
  return `/media/${outName}`;
}

async function syncMedium() {
  const posts = await withSeed(await loadMedium());
  const out = [];
  for (const p of posts) {
    const slug = slugFromLink(p.link);
    let cover = null;
    if (p.img) {
      try {
        cover = await toWebp(p.img, `medium-${slug}.webp`);
      } catch (err) {
        console.warn(`media: cover for ${slug} failed (${err.message})`);
      }
    }
    out.push({
      slug,
      title: p.title,
      link: p.link,
      date: new Date(p.date).toISOString().slice(0, 10),
      tags: p.cats ?? [],
      cover,
      coverSource: p.img ?? null,
    });
  }
  out.sort((a, b) => b.date.localeCompare(a.date));
  await writeFile(
    join(genDir, 'medium.json'),
    JSON.stringify({ source: FEED, posts: out }, null, 2) + '\n',
  );
  console.log(`medium: wrote ${out.length} posts`);
}

// ---------- GitHub ----------

async function syncGithub() {
  const res = await get(
    `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`,
    'application/vnd.github+json',
  );
  const repos = (await res.json()).map((r) => ({
    name: r.name,
    description: r.description,
    url: r.html_url,
    homepage: r.homepage || null,
    language: r.language,
    stars: r.stargazers_count,
    fork: r.fork,
    topics: r.topics ?? [],
    license: r.license?.spdx_id ?? null,
    defaultBranch: r.default_branch,
    pushedAt: r.pushed_at,
  }));
  await writeFile(
    join(genDir, 'github.json'),
    JSON.stringify({ user: GH_USER, repos }, null, 2) + '\n',
  );
  console.log(`github: wrote ${repos.length} repos`);

  const sim = repos.find((r) => r.name === 'simyourcity');
  if (sim) {
    const url = `https://raw.githubusercontent.com/${GH_USER}/simyourcity/${sim.defaultBranch}/resources/banner.png`;
    try {
      await toWebp(url, 'simyourcity-banner.webp');
    } catch (err) {
      console.warn(`media: SimYourCity banner failed (${err.message})`);
    }
  }
}

// ---------- Headshot ----------

async function syncHeadshot() {
  try {
    await toWebp(HEADSHOT, 'headshot.webp', 480);
  } catch (err) {
    console.warn(`media: headshot failed (${err.message})`);
  }
}

await mkdir(genDir, { recursive: true });
await mkdir(mediaDir, { recursive: true });
await syncMedium();
await syncGithub();
await syncHeadshot();
