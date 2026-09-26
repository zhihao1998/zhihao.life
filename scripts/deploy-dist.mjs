#!/usr/bin/env node
/**
 * Upload dist/ file-by-file via workbench (OSS times out on multi-MB blobs).
 * Mirrors to SITE/dist at the end for boot republish.
 *
 * Usage: npm run deploy:dist
 * Resumable via .cache/deploy-dist-state.json
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
} from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const INSTANCE = process.env.ECS_INSTANCE || 'i-2zealrv1ip22tasm313b';
const WWW = '/var/www/zhihao.life';
const SITE_DIST = '/home/wang/zhihao.life/dist';
const MAX_UPLOAD = 350_000;
const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(rootDir, 'dist');
const stateFile = join(rootDir, '.cache/deploy-dist-state.json');

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    const raw = `${r.stderr || ''}\n${r.stdout || ''}`;
    const clean = raw
      .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !/Uploading|Preparing|^[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/.test(l))
      .slice(-5)
      .join('\n');
    throw new Error(clean || `${cmd} exited ${r.status}`);
  }
  return r;
}

function workbench(args, retries = 5) {
  let last;
  for (let i = 1; i <= retries; i++) {
    try {
      return run('workbench', [...args, '-i', INSTANCE]);
    } catch (e) {
      last = e;
      console.warn(`  retry ${i}/${retries}: ${String(e.message).split('\n')[0].slice(0, 140)}`);
      spawnSync('sleep', [String(Math.min(6 * i, 30))]);
    }
  }
  throw last;
}

function listFiles(dir, base = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) listFiles(p, base, out);
    else out.push(relative(base, p).split(sep).join('/'));
  }
  return out;
}

function loadState() {
  try {
    return JSON.parse(readFileSync(stateFile, 'utf8'));
  } catch {
    return { done: {} };
  }
}

function saveState(state) {
  mkdirSync(dirname(stateFile), { recursive: true });
  writeFileSync(stateFile, JSON.stringify(state));
}

function main() {
  if (!existsSync(join(distDir, 'index.html'))) {
    console.error('dist/ missing — run npm run build first');
    process.exit(1);
  }

  const files = listFiles(distDir).sort((a, b) => {
    // HTML first so portfolio counts update before heavy assets finish.
    const ah = a.endsWith('.html') ? 0 : 1;
    const bh = b.endsWith('.html') ? 0 : 1;
    if (ah !== bh) return ah - bh;
    return a.localeCompare(b);
  });
  const state = loadState();
  const pending = files.filter((rel) => {
    const size = statSync(join(distDir, rel)).size;
    return state.done[rel] !== size;
  });
  console.log(`dist files=${files.length} pending=${pending.length} (resumable)`);

  workbench([
    'exec',
    '--timeout',
    '60',
    '-c',
    `mkdir -p ${shellQuote(WWW)} && swapon /swapfile 2>/dev/null || true`,
  ]);

  // Create all remote dirs in one shot (avoids per-file exec).
  const dirs = new Set();
  for (const rel of pending) {
    const d = dirname(rel);
    dirs.add(d === '.' ? WWW : `${WWW}/${d}`);
  }
  if (dirs.size > 0) {
    const mk = [...dirs].map((d) => `mkdir -p ${shellQuote(d)}`).join(' && ');
    console.log(`Creating ${dirs.size} remote directories…`);
    workbench(['exec', '--timeout', '120', '-c', mk]);
  }

  let uploaded = 0;
  for (let i = 0; i < pending.length; i++) {
    const rel = pending[i];
    const local = join(distDir, rel);
    const size = statSync(local).size;
    if (size > MAX_UPLOAD) {
      console.warn(`SKIP too large (${(size / 1e6).toFixed(2)}MB): ${rel}`);
      continue;
    }
    const remoteDir = dirname(rel) === '.' ? WWW : `${WWW}/${dirname(rel)}`;
    console.log(`  ${i + 1}/${pending.length} ${rel} (${(size / 1024).toFixed(0)}KB)`);
    workbench(['upload', local, `${remoteDir}/`, '-f', '--user-name', 'root']);
    state.done[rel] = size;
    uploaded++;
    if (uploaded % 5 === 0) saveState(state);
  }
  saveState(state);

  console.log('Mirroring www → site dist + reload nginx…');
  workbench([
    'exec',
    '--timeout',
    '180',
    '-c',
    [
      'set -euo pipefail',
      `rm -rf ${shellQuote(SITE_DIST)}`,
      `mkdir -p ${shellQuote(SITE_DIST)}`,
      `rsync -a ${shellQuote(WWW)}/ ${shellQuote(SITE_DIST)}/`,
      'chown -R wang:wang /home/wang/zhihao.life/dist',
      'nginx -s reload 2>/dev/null || sudo nginx -s reload || true',
      `du -sh ${shellQuote(WWW)} ${shellQuote(SITE_DIST)}`,
      'echo DIST_OK',
    ].join(' && '),
  ]);

  console.log(`Finished. uploaded=${uploaded}`);
  console.log('Done. https://zhihao.life');
}

main();
