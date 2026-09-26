#!/usr/bin/env node
/**
 * Install boot-time site publish on the ECS via workbench.
 * Safe for 2 GiB: enables swap + rsync existing dist/ → nginx (no Astro build).
 *
 * Usage: npm run install:boot-deploy
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const INSTANCE = process.env.ECS_INSTANCE || 'i-2zealrv1ip22tasm313b';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = join(root, 'scripts/remote/boot-deploy.sh');
const unitPath = join(root, 'scripts/remote/zhihao-life-boot.service');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (r.status !== 0) {
    throw new Error((r.stderr || r.stdout || `${cmd} failed`).trim());
  }
  return r;
}

function workbench(args) {
  return run('workbench', [...args, '-i', INSTANCE]);
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

if (!existsSync(scriptPath) || !existsSync(unitPath)) {
  console.error('missing scripts/remote/boot-deploy.sh or unit file');
  process.exit(1);
}

console.log('Uploading boot-deploy assets…');
workbench(['upload', scriptPath, '/tmp/', '-f', '--user-name', 'root']);
workbench(['upload', unitPath, '/tmp/', '-f', '--user-name', 'root']);

const install = [
  'set -euo pipefail',
  'install -m 755 /tmp/boot-deploy.sh /usr/local/sbin/zhihao-boot-deploy.sh',
  'install -m 644 /tmp/zhihao-life-boot.service /etc/systemd/system/zhihao-life-boot.service',
  'rm -f /tmp/boot-deploy.sh /tmp/zhihao-life-boot.service',
  // Ensure swap persists across reboot
  'if [[ -f /swapfile ]]; then',
  '  grep -q "/swapfile" /etc/fstab || echo "/swapfile none swap sw 0 0" >> /etc/fstab',
  '  swapon /swapfile 2>/dev/null || true',
  'fi',
  'systemctl daemon-reload',
  'systemctl enable zhihao-life-boot.service',
  // Also make sure nginx itself is enabled on boot
  'systemctl enable nginx 2>/dev/null || true',
  // Run once now to verify
  '/usr/local/sbin/zhihao-boot-deploy.sh',
  'systemctl is-enabled zhihao-life-boot.service',
  'systemctl is-active nginx || true',
  'curl -sI -o /dev/null -w "local_http=%{http_code}\\n" http://127.0.0.1/ || true',
  'tail -20 /var/log/zhihao-boot-deploy.log || true',
  'echo INSTALL_OK',
].join('\n');

console.log('Installing + enabling systemd unit…');
const r = workbench([
  'exec',
  '--timeout',
  '180',
  '-c',
  `bash -lc ${shellQuote(install)}`,
  '--user-name',
  'root',
]);
process.stdout.write(r.stdout || '');
process.stderr.write(r.stderr || '');
console.log('Done. On every reboot: swap on → publish dist/ → nginx.');
