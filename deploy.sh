#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm run build
rsync -a --delete dist/ /var/www/zhihao.life/
sudo nginx -s reload
echo "Deployed to /var/www/zhihao.life/"
