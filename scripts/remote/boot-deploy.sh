#!/usr/bin/env bash
# Safe boot deploy for the 2 GiB ECS — NO Astro/sharp build (that OOMs).
# Enables swap, publishes an existing dist/ to nginx, reloads nginx.
set -euo pipefail

SITE="${SITE:-/home/wang/zhihao.life}"
WWW="${WWW:-/var/www/zhihao.life}"
PHOTOS_SRC="${PHOTOS_SRC:-/home/wang/zhihao-photos-backup/content-portfolio}"
PHOTOS_DST="${PHOTOS_DST:-$SITE/src/assets/photos}"
LOG="${LOG:-/var/log/zhihao-boot-deploy.log}"

exec >>"$LOG" 2>&1
echo "==== $(date -Is) boot-deploy start ===="

# Swap first — nginx + rsync still need headroom after OOM events.
if [[ -f /swapfile ]]; then
  swapon /swapfile 2>/dev/null || true
fi
free -h | head -2 || true

# Optional: refresh hardlinks so src/assets/photos matches backup (cheap).
if [[ -d "$PHOTOS_SRC" ]]; then
  mkdir -p "$PHOTOS_DST"
  for d in "$PHOTOS_SRC"/*/; do
    [[ -d "$d" ]] || continue
    b=$(basename "$d")
    mkdir -p "$PHOTOS_DST/$b"
    find "$d" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) \
      -exec ln -f {} "$PHOTOS_DST/$b/" \; 2>/dev/null || true
  done
  chown -R wang:wang "$PHOTOS_DST" 2>/dev/null || true
  echo "photos linked: $(find "$PHOTOS_DST" -type f 2>/dev/null | wc -l)"
fi

mkdir -p "$WWW"

if [[ -f "$SITE/dist/index.html" ]]; then
  echo "publishing $SITE/dist → $WWW"
  rsync -a --delete "$SITE/dist/" "$WWW/"
elif [[ -f "$WWW/index.html" ]]; then
  echo "no dist/; keeping existing $WWW"
else
  echo "WARN: neither dist/ nor www has index.html — site may be empty"
fi

# Ensure nginx is up (reboot may leave it failed after OOM).
if command -v systemctl >/dev/null; then
  systemctl start nginx 2>/dev/null || true
  systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || true
else
  nginx -s reload 2>/dev/null || true
fi

echo "www: $(du -sh "$WWW" 2>/dev/null | cut -f1 || echo '?')"
echo "==== $(date -Is) boot-deploy done ===="
