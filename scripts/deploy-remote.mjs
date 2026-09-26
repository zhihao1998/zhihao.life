#!/usr/bin/env node
/**
 * One-shot deploy from this machine → Aliyun ECS via Workbench.
 *
 * 1. Compress local portfolio photos and replace remote backup (drops old large JPEGs)
 * 2. Sync site source via workbench upload (NOT git pull — ECS network to GitHub is slow)
 * 3. On ECS: hardlink photos → npm install → build → rsync to nginx
 *
 * GitHub remains the versioned backup; production always gets code through step 2.
 *
 * Usage:
 *   npm run deploy:remote
 *   npm run deploy:remote -- --skip-photos   # code + rebuild only
 *   npm run deploy:remote -- --skip-code     # photos only, then rebuild
 *   npm run deploy:remote -- --albums 20251012-Bardonecchia
 *
 * Env: ECS_INSTANCE, PHOTO_SOURCE, REMOTE_PHOTOS, REMOTE_SITE
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_INSTANCE = 'i-2zealrv1ip22tasm313b';
const DEFAULT_REMOTE_SITE = '/home/wang/zhihao.life';
const DEFAULT_REMOTE_PHOTOS = '/home/wang/zhihao-photos-backup/content-portfolio';
const REMOTE_USER = 'wang';
const WWW = '/var/www/zhihao.life';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const stagingRoot = join(rootDir, '.cache/deploy-remote');

function parseArgs(argv) {
  const out = {
    skipPhotos: false,
    skipCode: false,
    albums: null,
    quality: null,
    maxEdge: null,
    dryRun: false,
    reuseStaging: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--skip-photos') out.skipPhotos = true;
    else if (a === '--skip-code') out.skipCode = true;
    else if (a === '--albums') out.albums = argv[++i];
    else if (a === '--quality') out.quality = argv[++i];
    else if (a === '--max-edge') out.maxEdge = argv[++i];
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--reuse-staging') out.reuseStaging = true;
    else if (a === '--help' || a === '-h') {
      console.log(`One-click remote deploy via workbench.

Options:
  --skip-photos     do not re-upload photos
  --skip-code       do not sync source (rebuild only)
  --albums a,b      only these albums (implies photo upload)
  --quality N       JPEG quality for photo upload
  --max-edge N      max long edge for photo upload
  --reuse-staging   reuse already-compressed .cache/photo-upload
  --dry-run         print steps only`);
      process.exit(0);
    }
  }
  return out;
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    stdio: opts.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    cwd: opts.cwd,
    ...opts,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    if (opts.inherit) throw new Error(`${cmd} exited ${r.status}`);
    const msg = (r.stderr || r.stdout || '').trim() || `${cmd} exited ${r.status}`;
    throw new Error(msg);
  }
  return r;
}

function workbench(args, { timeout } = {}) {
  const instance = process.env.ECS_INSTANCE || DEFAULT_INSTANCE;
  const full = [...args, '-i', instance];
  if (timeout && !full.includes('--timeout')) {
    // insert after 'exec'
    const i = full.indexOf('exec');
    if (i >= 0) full.splice(i + 1, 0, '--timeout', String(timeout));
  }
  console.log(`$ workbench ${args[0]} … -i ${instance}`);
  return run('workbench', full, { inherit: true });
}

function formatBytes(n) {
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

function step(title) {
  console.log(`\n==> ${title}`);
}

function uploadPhotos(args) {
  step('Compress + upload photos (replace remote uncompressed backups)');
  // Per-album uploads: a single ~600MB bundle often stalls on workbench OSS.
  const photoArgs = ['scripts/upload-photos.mjs', '--force'];
  if (!args.albums) photoArgs.push('--prune');
  if (args.albums) photoArgs.push('--albums', args.albums);
  if (args.quality) photoArgs.push('--quality', String(args.quality));
  if (args.maxEdge) photoArgs.push('--max-edge', String(args.maxEdge));
  if (args.dryRun) photoArgs.push('--dry-run');
  if (args.reuseStaging) photoArgs.push('--reuse-staging');
  run(process.execPath, photoArgs, { cwd: rootDir, inherit: true });
}

function syncCode(args) {
  step('Sync site source to ECS');
  const remoteSite = process.env.REMOTE_SITE || DEFAULT_REMOTE_SITE;
  const tarName = 'zhihao-life-src.tar';
  const tarPath = join(stagingRoot, tarName);

  rmSync(stagingRoot, { recursive: true, force: true });
  mkdirSync(stagingRoot, { recursive: true });

  run(
    'tar',
    [
      '-cf',
      tarPath,
      '--exclude=node_modules',
      '--exclude=dist',
      '--exclude=.git',
      '--exclude=.cache',
      '--exclude=.astro',
      '--exclude=.cursor',
      '--exclude=src/assets/photos',
      '--exclude=media',
      '-C',
      rootDir,
      '.',
    ],
    { inherit: true },
  );

  console.log(`  packed ${formatBytes(statSync(tarPath).size)}`);

  if (args.dryRun) {
    console.log('  [dry-run] skip upload');
    return;
  }

  workbench(['upload', tarPath, '/tmp/', '-f', '--user-name', 'root']);
  workbench(
    [
      'exec',
      '-c',
      [
        `mkdir -p ${shellQuote(remoteSite)}`,
        `tar -xf ${shellQuote(`/tmp/${tarName}`)} -C ${shellQuote(remoteSite)}`,
        `chown -R ${REMOTE_USER}:${REMOTE_USER} ${shellQuote(remoteSite)}`,
        `rm -f ${shellQuote(`/tmp/${tarName}`)}`,
        `echo synced`,
      ].join(' && '),
    ],
    { timeout: 120 },
  );
}

function remoteBuildAndDeploy(args) {
  step('Hardlink photos + build + deploy on ECS');
  const remoteSite = process.env.REMOTE_SITE || DEFAULT_REMOTE_SITE;
  const remotePhotos = process.env.REMOTE_PHOTOS || DEFAULT_REMOTE_PHOTOS;
  const logFile = '/tmp/zhihao-deploy.log';
  const statusFile = '/tmp/zhihao-deploy.status';

  if (args.dryRun) {
    console.log('  [dry-run] skip remote build');
    return;
  }

  // Run build detached: workbench exec times out around ~20min which is too short
  // for Astro+sharp on a small ECS.
  const script = [
    'set -euo pipefail',
    `PHOTOS_SRC=${shellQuote(remotePhotos)}`,
    `PHOTOS_DST=${shellQuote(`${remoteSite}/src/assets/photos`)}`,
    `SITE=${shellQuote(remoteSite)}`,
    `WWW=${shellQuote(WWW)}`,
    `LOG=${shellQuote(logFile)}`,
    `STATUS=${shellQuote(statusFile)}`,
    'rm -f "$STATUS"',
    '{',
    '  echo "START $(date -Is)"',
    '  swapon /swapfile 2>/dev/null || true',
    '  free -h | head -2',
    '  rm -rf "$PHOTOS_DST"',
    '  mkdir -p "$PHOTOS_DST"',
    '  for d in "$PHOTOS_SRC"/*/; do',
    '    [ -d "$d" ] || continue',
    '    b=$(basename "$d")',
    '    mkdir -p "$PHOTOS_DST/$b"',
    `    find "$d" -maxdepth 1 -type f \\( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \\) -exec ln -f {} "$PHOTOS_DST/$b/" \\;`,
    '  done',
    '  chown -R wang:wang "$PHOTOS_DST"',
    '  echo "photos linked: $(find "$PHOTOS_DST" -type f | wc -l) files, $(du -sh "$PHOTOS_DST" | cut -f1)"',
    '  cd "$SITE"',
    '  # Drop previous dist early to free disk before sharp writes new assets',
    '  rm -rf dist',
    '  npm_config_registry=https://registry.npmmirror.com npm install --no-audit --no-fund',
    // 2 vCPU / ~1.6–2 GiB: keep Node heap modest, single-thread sharp, spare RAM for OS/nginx.
    '  export NODE_OPTIONS=--max-old-space-size=1024',
    '  export UV_THREADPOOL_SIZE=2',
    '  export SHARP_CONCURRENCY=1',
    '  export MAGICK_THREAD_LIMIT=1',
    '  npm run build',
    '  rsync -a --delete dist/ "$WWW/"',
    '  nginx -s reload 2>/dev/null || sudo nginx -s reload',
    '  df -h / | tail -1',
    '  free -h | head -2',
    '  du -sh "$PHOTOS_SRC" "$PHOTOS_DST"',
    '  echo DEPLOY_OK',
    '  echo OK > "$STATUS"',
    '} >"$LOG" 2>&1 || { echo FAIL > "$STATUS"; exit 1; }',
  ].join('\n');

  workbench(
    [
      'exec',
      '-c',
      `rm -f ${shellQuote(statusFile)}; nohup bash -lc ${shellQuote(script)} >/dev/null 2>&1 & echo STARTED:$!`,
      '--user-name',
      'root',
    ],
    { timeout: 60 },
  );

  step('Waiting for remote build (polling log)');
  const started = Date.now();
  const maxMs = 60 * 60 * 1000;
  while (Date.now() - started < maxMs) {
    const r = spawnSync(
      'workbench',
      [
        'exec',
        '-i',
        process.env.ECS_INSTANCE || DEFAULT_INSTANCE,
        '--timeout',
        '30',
        '-c',
        `tail -n 20 ${shellQuote(logFile)} 2>/dev/null; echo ---STATUS---; cat ${shellQuote(statusFile)} 2>/dev/null || echo RUNNING`,
      ],
      { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 },
    );
    const out = `${r.stdout || ''}${r.stderr || ''}`;
    const lines = out
      .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
      .split('\n')
      .map((l) => l.trimEnd())
      .filter(Boolean);
    for (const l of lines.slice(-25)) console.log(`  ${l}`);

    if (/\bOK\b/.test(out) && out.includes('---STATUS---')) {
      console.log('  remote deploy finished OK');
      return;
    }
    if (/\bFAIL\b/.test(out) && out.includes('---STATUS---')) {
      throw new Error('Remote deploy failed — see /tmp/zhihao-deploy.log on ECS');
    }
    spawnSync('sleep', ['20']);
  }
  throw new Error('Remote deploy timed out after 60 minutes');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const instance = process.env.ECS_INSTANCE || DEFAULT_INSTANCE;

  if (!existsSync(join(rootDir, 'package.json'))) {
    console.error('Run from the zhihao.life repo root.');
    process.exit(1);
  }

  const wb = spawnSync('workbench', ['version'], { encoding: 'utf8' });
  if (wb.status !== 0) {
    console.error('workbench CLI not available.');
    process.exit(1);
  }

  console.log(`Deploy → instance ${instance}`);
  console.log(`Site:    ${process.env.REMOTE_SITE || DEFAULT_REMOTE_SITE}`);
  console.log(`Photos:  ${process.env.REMOTE_PHOTOS || DEFAULT_REMOTE_PHOTOS}`);
  if (args.dryRun) console.log('[dry-run]');

  if (!args.skipPhotos) uploadPhotos(args);
  else console.log('\n==> Skipping photo upload');

  if (!args.skipCode) syncCode(args);
  else console.log('\n==> Skipping code sync');

  remoteBuildAndDeploy(args);

  rmSync(stagingRoot, { recursive: true, force: true });
  console.log('\nDone. https://zhihao.life');
}

main();
