## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Remote deployment

Production site: https://zhihao.life

**GitHub vs ECS:** push/commit to GitHub for version history. The ECS has no usable git remote for deploys (slow to China) — always sync source with Workbench upload, never `git pull` on the host.

SSH / files via Aliyun Workbench:

```
workbench connect -i i-2zealrv1ip22tasm313b
workbench exec -i i-2zealrv1ip22tasm313b -c '…'
workbench upload ./file /remote/dir/ -i i-2zealrv1ip22tasm313b -f
```

**One-click from this machine:**

On this **2 GiB ECS, never run Astro/sharp on the host** (it OOMs). Build locally, then push `dist/` via Workbench:

```bash
# 1) compress+sync photos locally if needed, then:
npm run build
npm run deploy:dist          # chunked workbench upload → /var/www/zhihao.life

# code-only sync (no remote build) is also available, but prefer deploy:dist:
npm run deploy:remote -- --skip-photos   # only if you must build on ECS; ensure 4G swap first
```

Photos are mozjpeg-compressed before upload when using `upload:photos` / full `deploy:remote`. Full-library runs prune remote album dirs not in the local set so old large copies free disk.

Keep a **≥2G swapfile** on the ECS (`/swapfile`) even when using `deploy:dist` — nginx and unpacking still need headroom.

**Incremental photos (recommended day-to-day):**

```bash
# Drop new album folders into F:\Pictures\作品集, then:
npm run deploy:photos
# or only one album:
npm run deploy:photos -- --albums 20260301-Tokyo
npm run deploy:photos -- --dry-run
```

Detects new/changed files via `.cache/photos-manifest.json`, compresses only those, builds while **keeping** the Astro image cache, and uploads only new `dist/` assets. Add `--backup` to also push compressed JPEGs to the ECS photo backup.

**Boot auto-publish** (no Astro build — safe on 2 GiB):

```bash
npm run install:boot-deploy
```

Installs `zhihao-life-boot.service`: on every reboot it enables swap, refreshes photo hardlinks, rsyncs existing `dist/` → `/var/www/zhihao.life/`, and starts/reloads nginx. Full rebuilds still happen on this machine via `deploy:dist`.

Static files are served by nginx from `/var/www/zhihao.life/`.

**Manual deploy on the ECS** (if you already updated photos/code there):

```bash
PHOTOS_SRC=/home/wang/zhihao-photos-backup/content-portfolio
PHOTOS_DST=/home/wang/zhihao.life/src/assets/photos
rm -rf "$PHOTOS_DST" && mkdir -p "$PHOTOS_DST"
for d in "$PHOTOS_SRC"/*/; do
  b=$(basename "$d"); mkdir -p "$PHOTOS_DST/$b"
  find "$d" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) \
    -exec ln -f {} "$PHOTOS_DST/$b/" \;
done
cd /home/wang/zhihao.life
npm_config_registry=https://registry.npmmirror.com npm install
NODE_OPTIONS=--max-old-space-size=1536 npm run build
rsync -a --delete dist/ /var/www/zhihao.life/ && sudo nginx -s reload
```

The ECS is small (~1.6GiB RAM); keep a 2G+ swapfile for Astro/sharp builds. Do not ship `dist/` or portfolio JPEGs through GitHub Releases.

### Photography (do not delete casually)

Remote web-sized albums live **outside** the git tree:

| Path | What |
|------|------|
| `/home/wang/zhihao-photos-backup/content-portfolio/` | Compressed album JPEGs (upload via `deploy:remote` / `upload:photos`) |
| `/home/wang/zhihao-photos-backup/images/` | Misc site images |

Local machine: `src/assets/photos/` is gitignored (`npm run sync:photos`). Prefer replacing backups with compressed uploads over deleting the backup root.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
