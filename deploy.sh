#!/usr/bin/env bash
# Publish existing dist/ to nginx. Does NOT run Astro build (2 GiB ECS OOMs).
# For a full rebuild, run `npm run build && npm run deploy:dist` on a larger machine.
set -euo pipefail
cd "$(dirname "$0")"
if [[ ! -f dist/index.html ]]; then
  echo "dist/ missing — upload a local build with: npm run deploy:dist" >&2
  exit 1
fi
rsync -a --delete dist/ /var/www/zhihao.life/
sudo nginx -s reload 2>/dev/null || nginx -s reload
echo "Published dist/ → /var/www/zhihao.life/"
