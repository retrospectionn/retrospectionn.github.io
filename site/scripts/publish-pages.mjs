// Copies the build (site/dist/**) to the repository root, which GitHub Pages serves from `main`.
//
// - Deletes only files listed in the previous /.pages-manifest.json that this build no longer
//   produces, then copies every file from dist and writes a new manifest and /.nojekyll.
// - Refuses to write into or delete from site/, .git/, .github/, .claude/,
//   .planning/, and refuses to overwrite any existing root file it did not write itself
//   (a file not listed in the previous manifest), so nothing hand-made is ever clobbered.
// Run `pnpm build` first.
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readdir, readFile, rm, rmdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, '..');
const dist = join(site, 'dist');
const repo = resolve(site, '..');
const MANIFEST = '.pages-manifest.json';
const PROTECTED_DIRS = ['site', '.git', '.github', '.claude', '.planning'];
// Root files that belong to the repo, not to the build.
const RESERVED_FILES = [MANIFEST, '.nojekyll', 'README.md', 'PLAN.md', '.gitignore', '.gitattributes'];

function fail(msg) {
  console.error(`publish-pages: ${msg}`);
  process.exit(1);
}

/** Validates a repo-relative POSIX path and returns its absolute path. */
function target(rel) {
  if (typeof rel !== 'string' || rel === '' || rel.startsWith('/') || rel.includes('\\')) fail(`bad path ${JSON.stringify(rel)}`);
  const parts = rel.split('/');
  if (parts.some((p) => p === '' || p === '.' || p === '..')) fail(`bad path ${JSON.stringify(rel)}`);
  if (PROTECTED_DIRS.includes(parts[0].toLowerCase())) fail(`refusing to touch protected path ${rel}`);
  if (parts.length === 1 && RESERVED_FILES.includes(parts[0])) fail(`refusing to touch reserved file ${rel}`);
  const abs = resolve(repo, ...parts);
  if (!abs.startsWith(repo + sep)) fail(`path escapes the repository: ${rel}`);
  return abs;
}

async function walk(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(abs, base)));
    else if (entry.isFile()) out.push(relative(base, abs).split(sep).join('/'));
    else fail(`unexpected non-file in dist: ${abs}`);
  }
  return out;
}

if (!existsSync(join(dist, 'index.html'))) fail('site/dist/index.html is missing; run `pnpm build` first');

const files = (await walk(dist)).sort();
for (const f of files) target(f); // validate everything before changing anything

let previous = [];
const manifestPath = join(repo, MANIFEST);
if (existsSync(manifestPath)) {
  const parsed = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (!Array.isArray(parsed.files)) fail(`${MANIFEST} has no "files" array`);
  previous = parsed.files;
  for (const f of previous) target(f);
}
const owned = new Set(previous);

// Never overwrite a file this script did not write.
const foreign = [];
for (const f of files) if (!owned.has(f) && existsSync(target(f))) foreign.push(f);
if (foreign.length) fail(`these root files exist but are not in ${MANIFEST}; move or delete them first:\n  ${foreign.join('\n  ')}`);

// Remove files from the previous publish that this build no longer has.
const next = new Set(files);
const removed = [];
const touchedDirs = new Set();
for (const f of previous) {
  if (next.has(f)) continue;
  const abs = target(f);
  if (existsSync(abs)) {
    await rm(abs);
    removed.push(f);
  }
  for (let d = dirname(abs); d !== repo && d.startsWith(repo + sep); d = dirname(d)) touchedDirs.add(d);
}
// Drop directories the removals left empty (deepest first); never protected ones.
for (const d of [...touchedDirs].sort((a, b) => b.length - a.length)) {
  const top = relative(repo, d).split(sep)[0].toLowerCase();
  if (PROTECTED_DIRS.includes(top)) continue;
  try {
    if ((await stat(d)).isDirectory() && (await readdir(d)).length === 0) await rmdir(d);
  } catch {
    /* already gone */
  }
}

for (const f of files) {
  const abs = target(f);
  await mkdir(dirname(abs), { recursive: true });
  await copyFile(join(dist, ...f.split('/')), abs);
}

await writeFile(join(repo, '.nojekyll'), '');
await writeFile(manifestPath, `${JSON.stringify({ note: 'Written by site/scripts/publish-pages.mjs. Do not edit.', files }, null, 2)}\n`);

console.log(`publish-pages: wrote ${files.length} files, removed ${removed.length} stale file(s).`);
for (const f of removed) console.log(`  - ${f}`);
