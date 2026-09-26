#!/usr/bin/env node
/**
 * Compress album JPEGs from the photography library, then upload to the ECS
 * photo backup via Aliyun Workbench (OSS intermediary).
 *
 * workbench upload is single-file only — by default each album is one .tar.
 * Use --bundle to pack all selected albums into a single upload (faster).
 *
 * Usage:
 *   npm run upload:photos
 *   npm run upload:photos -- --albums 20250608-Malmo,20251012-Bardonecchia
 *   npm run upload:photos -- --force --bundle --prune
 *   npm run upload:photos -- --dry-run
 *
 * Env:
 *   PHOTO_SOURCE   local album root (default: F:\Pictures\作品集 / WSL mount)
 *   ECS_INSTANCE   workbench instance id (default below)
 *   REMOTE_PHOTOS  remote dest (default: content-portfolio backup)
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
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
const REMOTE_USER = 'wang';

const rootDir = dirname(fileURLToPath(import.meta.url));
const stagingRoot = join(rootDir, '../.cache/photo-upload');

function parseArgs(argv) {
  const out = {
    albums: null,
    quality: 88,
    maxEdge: 3600,
    dryRun: false,
    force: false,
    bundle: false,
    prune: false,
    keepStaging: false,
    reuseStaging: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--albums') out.albums = argv[++i]?.split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--quality') out.quality = Number(argv[++i]);
    else if (a === '--max-edge') out.maxEdge = Number(argv[++i]);
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--force') out.force = true;
    else if (a === '--bundle') out.bundle = true;
    else if (a === '--prune') out.prune = true;
    else if (a === '--keep-staging') out.keepStaging = true;
    else if (a === '--reuse-staging') out.reuseStaging = true;
    else if (a === '--help' || a === '-h') {
      console.log(`Compress + upload portfolio albums to ECS via workbench.

Options:
  --albums a,b       only these folders
  --quality N        JPEG quality (default 88)
  --max-edge N       longest side px; 0 = no resize (default 3600)
  --bundle           one tar for all albums (avoid for large libraries)
  --force            replace remote albums even if they already exist
  --prune            remove remote album dirs not in this upload set
  --reuse-staging    skip recompress; upload existing .cache/photo-upload/albums
  --dry-run          compress + pack only, skip upload
  --keep-staging     leave .cache/photo-upload after success`);
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

function listImages(dir) {
  return readdirSync(dir)
    .filter((name) => IMAGE_RE.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    ...opts,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    const raw = `${r.stderr || ''}\n${r.stdout || ''}`;
    const clean = raw
      .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !/^([⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]|Uploading|Preparing)/.test(l))
      .slice(-8)
      .join('\n');
    throw new Error(clean || `${cmd} exited ${r.status}`);
  }
  return r;
}

function workbench(args, { retries = 1 } = {}) {
  const instance = process.env.ECS_INSTANCE || DEFAULT_INSTANCE;
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return run('workbench', [...args, '-i', instance], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        console.warn(`  retry ${attempt}/${retries - 1}: ${e.message.split('\n')[0]}`);
      }
    }
  }
  throw lastErr;
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function remoteAlbumExists(remoteRoot, album) {
  const r = workbench([
    'exec',
    '-c',
    `test -d ${shellQuote(`${remoteRoot}/${album}`)} && echo yes || echo no`,
  ]);
  return (r.stdout || '').trim() === 'yes';
}

function pruneRemoteAlbums(remoteRoot, keepAlbums) {
  console.log('  pruning remote albums not in upload set…');
  const py = [
    'import os, shutil',
    `root = ${JSON.stringify(remoteRoot)}`,
    `keep = set(${JSON.stringify(keepAlbums)})`,
    'for name in os.listdir(root):',
    '    path = os.path.join(root, name)',
    '    if os.path.isdir(path) and name not in keep:',
    '        print("prune", name)',
    '        shutil.rmtree(path)',
    `os.system("chown -R ${REMOTE_USER}:${REMOTE_USER} " + root)`,
    'print(os.popen("du -sh " + root).read().strip())',
  ].join('\n');
  const r = workbench([
    'exec',
    '--timeout',
    '120',
    '-c',
    `python3 -c ${shellQuote(py)}`,
  ]);
  const out = (r.stdout || '').trim();
  if (out) console.log(out);
}

function safeTarName(album) {
  return `photo-upload-${album.replace(/[^a-zA-Z0-9._-]+/g, '_')}.tar`;
}

async function compressImage(src, dest, { quality, maxEdge }) {
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
    .jpeg({
      quality,
      mozjpeg: true,
      chromaSubsampling: '4:4:4',
    })
    .toFile(dest);
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

async function compressAlbum(fromDir, stagedAlbum, args) {
  const images = listImages(fromDir);
  if (images.length === 0) return { images: 0, bytesIn: 0, bytesOut: 0 };

  mkdirSync(stagedAlbum, { recursive: true });
  let bytesIn = 0;
  let bytesOut = 0;
  for (const file of images) {
    const src = join(fromDir, file);
    const dest = join(stagedAlbum, file.replace(/\.(png|webp)$/i, '.jpg'));
    bytesIn += statSync(src).size;
    await compressImage(src, dest, args);
    bytesOut += statSync(dest).size;
  }
  return { images: images.length, bytesIn, bytesOut };
}

const CHUNK_BYTES = 8 * 1024 * 1024; // workbench OSS often times out above ~10–15MB

function uploadAndExtract(tarPath, remoteTar, remoteRoot, albums, { prune }) {
  const size = statSync(tarPath).size;
  const clearCmd = prune
    ? `find ${shellQuote(remoteRoot)} -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} +`
    : albums.map((album) => `rm -rf ${shellQuote(`${remoteRoot}/${album}`)}`).join(' && ');

  if (size <= CHUNK_BYTES) {
    console.log(`  uploading ${formatBytes(size)}…`);
    workbench(['upload', tarPath, '/tmp/', '-f', '--user-name', 'root'], { retries: 4 });
    const r = workbench([
      'exec',
      '--timeout',
      '300',
      '-c',
      [
        `mkdir -p ${shellQuote(remoteRoot)}`,
        clearCmd,
        `tar -xf ${shellQuote(remoteTar)} -C ${shellQuote(remoteRoot)}`,
        `chown -R ${REMOTE_USER}:${REMOTE_USER} ${shellQuote(remoteRoot)}`,
        `rm -f ${shellQuote(remoteTar)}`,
        `du -sh ${shellQuote(remoteRoot)}`,
      ].join(' && '),
    ]);
    const out = (r.stdout || '').trim();
    if (out) console.log(`  remote: ${out.split('\n').pop()}`);
    return;
  }

  const partDir = `${tarPath}.parts`;
  rmSync(partDir, { recursive: true, force: true });
  mkdirSync(partDir, { recursive: true });
  const prefix = join(partDir, 'part.');
  run('split', ['-b', String(CHUNK_BYTES), '-d', '-a', '3', tarPath, prefix]);
  const parts = readdirSync(partDir).filter((n) => n.startsWith('part.')).sort();
  console.log(`  uploading ${formatBytes(size)} as ${parts.length} × ${formatBytes(CHUNK_BYTES)} chunks…`);

  const remoteParts = [];
  for (let i = 0; i < parts.length; i++) {
    const localPart = join(partDir, parts[i]);
    const remotePart = `/tmp/${basename(remoteTar)}.${parts[i]}`;
    console.log(`  chunk ${i + 1}/${parts.length} (${formatBytes(statSync(localPart).size)})`);
    workbench(['upload', localPart, '/tmp/', '-f', '--user-name', 'root'], { retries: 5 });
    // workbench keeps basename under /tmp/
    remoteParts.push(`/tmp/${parts[i]}`);
    // Rename to stable names in case basename collides across albums
    workbench([
      'exec',
      '-c',
      `mv -f ${shellQuote(`/tmp/${parts[i]}`)} ${shellQuote(remotePart)}`,
    ]);
    remoteParts[remoteParts.length - 1] = remotePart;
  }

  const catList = remoteParts.map(shellQuote).join(' ');
  const r = workbench([
    'exec',
    '--timeout',
    '300',
    '-c',
    [
      `mkdir -p ${shellQuote(remoteRoot)}`,
      clearCmd,
      `cat ${catList} > ${shellQuote(remoteTar)}`,
      `rm -f ${catList}`,
      `tar -xf ${shellQuote(remoteTar)} -C ${shellQuote(remoteRoot)}`,
      `chown -R ${REMOTE_USER}:${REMOTE_USER} ${shellQuote(remoteRoot)}`,
      `rm -f ${shellQuote(remoteTar)}`,
      `du -sh ${shellQuote(remoteRoot)}`,
    ].join(' && '),
  ]);
  rmSync(partDir, { recursive: true, force: true });
  const out = (r.stdout || '').trim();
  if (out) console.log(`  remote: ${out.split('\n').pop()}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceRoot = resolveSource();
  const remoteRoot = process.env.REMOTE_PHOTOS || DEFAULT_REMOTE;
  const instance = process.env.ECS_INSTANCE || DEFAULT_INSTANCE;

  if (!sourceRoot) {
    console.error('Photo source not found. Set PHOTO_SOURCE or mount F:\\Pictures\\作品集.');
    process.exit(1);
  }

  if (!args.dryRun) {
    const wb = spawnSync('workbench', ['version'], { encoding: 'utf8' });
    if (wb.status !== 0) {
      console.error('workbench CLI not available. Install/configure Aliyun Workbench first.');
      process.exit(1);
    }
  }

  const albumDirs = readdirSync(sourceRoot)
    .filter((name) => {
      const full = join(sourceRoot, name);
      return statSync(full).isDirectory() && /^\d{8}-/.test(name);
    })
    .filter((name) => !args.albums || args.albums.includes(name))
    .sort((a, b) => b.localeCompare(a));

  if (albumDirs.length === 0) {
    console.error('No album folders matched.');
    process.exit(1);
  }

  console.log(`Source:  ${sourceRoot}`);
  console.log(`Remote:  ${remoteRoot}  (instance ${instance})`);
  console.log(`Quality: ${args.quality}  max-edge: ${args.maxEdge || 'none'}`);
  console.log(
    `Albums:  ${albumDirs.length}` +
      (args.bundle ? '  [bundle]' : '') +
      (args.prune ? '  [prune]' : '') +
      (args.reuseStaging ? '  [reuse-staging]' : '') +
      (args.dryRun ? '  [dry-run]' : ''),
  );
  console.log('');

  if (!args.reuseStaging) {
    rmSync(stagingRoot, { recursive: true, force: true });
  }
  mkdirSync(join(stagingRoot, 'albums'), { recursive: true });

  const staged = [];
  let skipped = 0;
  let bytesIn = 0;
  let bytesOut = 0;

  for (const album of albumDirs) {
    if (!args.force && !args.dryRun) {
      try {
        if (remoteAlbumExists(remoteRoot, album)) {
          console.log(`skip (exists): ${album}  (use --force to replace)`);
          skipped += 1;
          continue;
        }
      } catch (e) {
        console.warn(`warn: could not check remote ${album}: ${e.message}`);
      }
    }

    const stagedAlbum = join(stagingRoot, 'albums', album);
    if (args.reuseStaging && existsSync(stagedAlbum) && listImages(stagedAlbum).length > 0) {
      const files = listImages(stagedAlbum);
      let out = 0;
      for (const f of files) out += statSync(join(stagedAlbum, f)).size;
      bytesOut += out;
      staged.push(album);
      console.log(`${album}: reuse ${files.length} files  ${formatBytes(out)}`);
      continue;
    }

    const result = await compressAlbum(join(sourceRoot, album), stagedAlbum, args);
    if (result.images === 0) {
      console.warn(`skip empty: ${album}`);
      skipped += 1;
      continue;
    }
    bytesIn += result.bytesIn;
    bytesOut += result.bytesOut;
    staged.push(album);
    console.log(
      `${album}: ${result.images} files  ${formatBytes(result.bytesIn)} → ${formatBytes(result.bytesOut)}`,
    );
  }

  if (staged.length === 0) {
    console.log(`Nothing to upload. skipped=${skipped}`);
    if (!args.keepStaging && !args.reuseStaging) rmSync(stagingRoot, { recursive: true, force: true });
    return;
  }

  let uploaded = 0;

  if (args.bundle) {
    const tarName = 'photo-upload-bundle.tar';
    const tarPath = join(stagingRoot, tarName);
    run('tar', ['-cf', tarPath, '-C', join(stagingRoot, 'albums'), ...staged]);
    console.log(`\nbundle: ${staged.length} albums  tar ${formatBytes(statSync(tarPath).size)}`);
    if (!args.dryRun) {
      uploadAndExtract(tarPath, `/tmp/${tarName}`, remoteRoot, staged, {
        prune: args.prune,
      });
      uploaded = staged.length;
    }
  } else if (!args.dryRun) {
    for (const album of staged) {
      const tarName = safeTarName(album);
      const tarPath = join(stagingRoot, tarName);
      run('tar', ['-cf', tarPath, '-C', join(stagingRoot, 'albums'), album]);
      console.log(`${album}:`);
      uploadAndExtract(tarPath, `/tmp/${tarName}`, remoteRoot, [album], {
        prune: false,
      });
      rmSync(tarPath, { force: true });
      uploaded += 1;
      console.log(`  done → ${remoteRoot}/${album}/`);
    }
    if (args.prune) pruneRemoteAlbums(remoteRoot, staged);
  }

  if (!args.keepStaging && !args.reuseStaging) {
    rmSync(stagingRoot, { recursive: true, force: true });
  }

  console.log('');
  console.log(
    `Finished. uploaded=${uploaded} skipped=${skipped}  ${formatBytes(bytesIn)} → ${formatBytes(bytesOut)}` +
      (bytesIn ? ` (${Math.round((100 * bytesOut) / bytesIn)}%)` : ''),
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
