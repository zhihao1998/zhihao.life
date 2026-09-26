#!/usr/bin/env node
/**
 * Incremental one-click photo deploy (2 GiB ECS friendly).
 *
 * Only processes NEW/CHANGED photos vs .cache/photos-manifest.json:
 *   1) compress → src/assets/photos
 *   2) astro build (keeps .astro image cache — do not delete it)
 *   3) deploy:dist (uploads only files not yet recorded in deploy-dist-state)
 *
 * Usage:
 *   npm run deploy:photos
 *   npm run deploy:photos -- --albums 20260301-Tokyo
 *   npm run deploy:photos -- --dry-run
 *   npm run deploy:photos -- --backup
 *
 * Env: PHOTO_SOURCE, ECS_INSTANCE, REMOTE_PHOTOS
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const IMAGE_RE = /\.(jpe?g|png|webp)$/i;
const DEFAULT_SOURCES = [
  '/mnt/f/Pictures/作品集',
  'F:/Pictures/作品集',
  '/mnt/f/Pictures/\u4f5c\u54c1\u96c6',
];
const DEFAULT_INSTANCE = 'i-2zealrv1ip22tasm313b';
const DEFAULT_REMOTE = '/home/wang/zhihao-photos-backup/content-portfolio';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = join(rootDir, 'src/assets/photos');
const manifestPath = join(rootDir, '.cache/photos-manifest.json');
const stagingRoot = join(rootDir, '.cache/photo-incremental');

function parseArgs(argv) {
  const out = {
    albums: null,
    dryRun: false,
    backup: false,
    quality: 85,
    maxEdge: 2400,
    skipBuild: false,
    skipDist: false,
    seed: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--albums') out.albums = argv[++i]?.split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--backup') out.backup = true;
    else if (a === '--quality') out.quality = Number(argv[++i]);
    else if (a === '--max-edge') out.maxEdge = Number(argv[++i]);
    else if (a === '--skip-build') out.skipBuild = true;
    else if (a === '--skip-dist') out.skipDist = true;
    else if (a === '--seed') out.seed = true;
    else if (a === '--help' || a === '-h') {
      console.log(`Incremental photo deploy.

Options:
  --albums a,b     only these albums (default: auto-detect new/changed)
  --backup         also upload compressed JPEGs to ECS photo backup
  --quality N      JPEG quality for asset copies (default 85)
  --max-edge N     max long edge (default 2400)
  --skip-build     compress/sync only
  --skip-dist      build but do not upload dist
  --seed           write manifest from current library only (no deploy)
  --dry-run        show what would change`);
      process.exit(0);
    }
  }
  return out;
}

function resolveSource() {
  if (process.env.PHOTO_SOURCE && existsSync(process.env.PHOTO_SOURCE)) {
    return process.env.PHOTO_SOURCE;
  }
  for (const p of DEFAULT_SOURCES) {
    if (existsSync(p)) return p;
  }
  return null;
}

function loadManifest() {
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return { version: 1, albums: {} };
  }
}

function saveManifest(m) {
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(m, null, 2));
}

function fingerprint(filePath) {
  const st = statSync(filePath);
  const sample = readFileSync(filePath).subarray(0, Math.min(65536, st.size));
  const hash = createHash('sha1')
    .update(sample)
    .update(String(st.size))
    .digest('hex')
    .slice(0, 12);
  return { size: st.size, mtimeMs: st.mtimeMs, hash };
}

function listAlbumImages(dir) {
  return readdirSync(dir)
    .filter((n) => IMAGE_RE.test(n))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function listAlbums(sourceRoot, filter) {
  return readdirSync(sourceRoot)
    .filter((name) => {
      const full = join(sourceRoot, name);
      return statSync(full).isDirectory() && /^\d{8}-/.test(name);
    })
    .filter((name) => !filter || filter.includes(name))
    .sort((a, b) => b.localeCompare(a));
}

function diffAlbum(sourceDir, album, manifest) {
  const prev = manifest.albums[album]?.files || {};
  const images = listAlbumImages(sourceDir);
  const changed = [];
  const nextFiles = {};
  for (const name of images) {
    const fp = fingerprint(join(sourceDir, name));
    nextFiles[name] = fp;
    const old = prev[name];
    if (!old || old.size !== fp.size || old.hash !== fp.hash) changed.push(name);
  }
  return { images, changed, nextFiles };
}

async function compressTo(src, dest, { quality, maxEdge }) {
  mkdirSync(dirname(dest), { recursive: true });
  let img = sharp(src).rotate();
  const meta = await img.metadata();
  const longEdge = Math.max(meta.width || 0, meta.height || 0);
  if (maxEdge > 0 && longEdge > maxEdge) {
    img = img.resize({
      width: meta.width >= meta.height ? maxEdge : undefined,
      height: meta.height > meta.width ? maxEdge : undefined,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  await img
    .jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(dest);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    stdio: opts.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    cwd: opts.cwd || rootDir,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    if (opts.inherit) throw new Error(`${cmd} exited ${r.status}`);
    throw new Error((r.stderr || r.stdout || `${cmd} failed`).trim());
  }
  return r;
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function workbench(args, retries = 4) {
  const instance = process.env.ECS_INSTANCE || DEFAULT_INSTANCE;
  let last;
  for (let i = 1; i <= retries; i++) {
    try {
      return run('workbench', [...args, '-i', instance]);
    } catch (e) {
      last = e;
      console.warn(`  retry ${i}/${retries}: ${String(e.message).split('\n')[0].slice(0, 120)}`);
      spawnSync('sleep', [String(Math.min(5 * i, 20))]);
    }
  }
  throw last;
}

async function uploadBackupAlbum(album, stagedDir) {
  const remoteRoot = process.env.REMOTE_PHOTOS || DEFAULT_REMOTE;
  const tarName = `incr-${album.replace(/[^a-zA-Z0-9._-]+/g, '_')}.tar`;
  const tarPath = join(stagingRoot, tarName);
  run('tar', ['-cf', tarPath, '-C', dirname(stagedDir), basename(stagedDir)]);
  const size = statSync(tarPath).size;

  if (size > 350_000) {
    console.log(`  backup ${album}: per-file (${Math.round(size / 1024)}KB tar)`);
    workbench(['exec', '-c', `mkdir -p ${shellQuote(`${remoteRoot}/${album}`)}`]);
    for (const name of listAlbumImages(stagedDir)) {
      const f = join(stagedDir, name);
      if (statSync(f).size > 350_000) {
        console.warn(`  skip large ${name}`);
        continue;
      }
      workbench(['upload', f, `${remoteRoot}/${album}/`, '-f', '--user-name', 'root']);
    }
    return;
  }

  console.log(`  backup ${album}: tar ${Math.round(size / 1024)}KB`);
  workbench(['upload', tarPath, '/tmp/', '-f', '--user-name', 'root']);
  workbench([
    'exec',
    '--timeout',
    '120',
    '-c',
    [
      `mkdir -p ${shellQuote(remoteRoot)}`,
      `rm -rf ${shellQuote(`${remoteRoot}/${album}`)}`,
      `tar -xf ${shellQuote(`/tmp/${tarName}`)} -C ${shellQuote(remoteRoot)}`,
      `chown -R wang:wang ${shellQuote(`${remoteRoot}/${album}`)}`,
      `rm -f ${shellQuote(`/tmp/${tarName}`)}`,
    ].join(' && '),
  ]);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceRoot = resolveSource();
  if (!sourceRoot) {
    console.error('Photo source not found. Mount F:\\Pictures\\作品集 or set PHOTO_SOURCE.');
    process.exit(1);
  }

  const manifest = loadManifest();
  const albums = listAlbums(sourceRoot, args.albums);
  if (albums.length === 0) {
    console.error('No albums matched.');
    process.exit(1);
  }

  if (args.seed) {
    for (const album of albums) {
      const { nextFiles, images } = diffAlbum(join(sourceRoot, album), album, { albums: {} });
      if (images.length === 0) continue;
      manifest.albums[album] = {
        files: nextFiles,
        updatedAt: new Date().toISOString(),
        seeded: true,
      };
    }
    saveManifest(manifest);
    console.log(`Seeded manifest with ${Object.keys(manifest.albums).length} albums.`);
    return;
  }

  const plan = [];
  for (const album of albums) {
    const { changed, nextFiles, images } = diffAlbum(join(sourceRoot, album), album, manifest);
    if (images.length === 0) continue;
    const isNew = !manifest.albums[album];
    if (!isNew && changed.length === 0) continue;
    plan.push({
      album,
      changed: isNew ? images : changed,
      nextFiles,
      isNew,
    });
  }

  if (plan.length === 0) {
    console.log('No new or changed photos. Nothing to deploy.');
    return;
  }

  console.log(`Source: ${sourceRoot}`);
  console.log(`Incremental albums: ${plan.length}`);
  for (const p of plan) {
    console.log(`  ${p.album}: ${p.changed.length} file(s)${p.isNew ? ' [new album]' : ''}`);
  }
  if (args.dryRun) {
    console.log('[dry-run] stop');
    return;
  }

  rmSync(stagingRoot, { recursive: true, force: true });
  mkdirSync(stagingRoot, { recursive: true });
  mkdirSync(assetsRoot, { recursive: true });

  let compressed = 0;
  for (const item of plan) {
    const fromDir = join(sourceRoot, item.album);
    const toDir = join(assetsRoot, item.album);
    const staged = join(stagingRoot, item.album);
    mkdirSync(toDir, { recursive: true });
    mkdirSync(staged, { recursive: true });

    for (const name of item.changed) {
      const src = join(fromDir, name);
      const destName = name.replace(/\.(png|webp)$/i, '.jpg');
      const dest = join(toDir, destName);
      const stage = join(staged, destName);
      await compressTo(src, dest, args);
      copyFileSync(dest, stage);
      compressed++;
      console.log(`  + ${item.album}/${destName}`);
    }

    if (args.backup) await uploadBackupAlbum(item.album, staged);

    manifest.albums[item.album] = {
      files: item.nextFiles,
      updatedAt: new Date().toISOString(),
    };
  }
  saveManifest(manifest);
  console.log(`Compressed ${compressed} photo(s) → src/assets/photos/`);

  if (!args.skipBuild) {
    console.log('Building (reuses .astro image cache for unchanged assets)…');
    run('npm', ['run', 'build'], { inherit: true });
  }

  if (!args.skipDist && !args.skipBuild) {
    console.log('Uploading only new/changed dist files…');
    run(process.execPath, ['scripts/deploy-dist.mjs'], { inherit: true });
  }

  rmSync(stagingRoot, { recursive: true, force: true });
  console.log('Incremental deploy done. https://zhihao.life');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
