# Zhihao Wang — zhihao.life

Personal site: photography-first hub with academic pages. Built with Astro, deployed as static files to nginx.

## Develop

```bash
npm install
npm run sync:photos          # copy albums from F:\Pictures\作品集 (WSL: /mnt/f/...)
npm run dev
```

## Photos

Album folders follow `YYYYMMDD-Title` (e.g. `20250608-Malmo`). Drop a new folder into the library, then:

```bash
# sync everything
npm run sync:photos

# or only some albums / cap photos per album while testing (never for production)
npm run sync:photos -- --albums 20250608-Malmo,20250418-Madrid --max-per-album 8
npm run sync:photos -- --clean   # replace local copies with full albums
```

`--max-per-album` is for local smoke tests only. Production deploys (`npm run deploy:remote`) always upload the full library from `F:\Pictures\作品集`.

Override the source path if needed:

```bash
PHOTO_SOURCE="/mnt/f/Pictures/作品集" npm run sync:photos
```

`src/data/albums.ts` scans `src/assets/photos/*` at build time — new folders appear under Portfolio automatically. Album pages use PhotoSwipe (click to enlarge, arrow keys / on-screen arrows to browse).

## Build & deploy

Code history lives on GitHub (`git push`). The ECS is updated by **Workbench file sync**, not `git pull`.

On the ECS itself (after code/photos are already there):

```bash
./deploy.sh
```

From this machine (photos + workbench code sync + remote build):

```bash
npm run deploy:remote
```

Day-to-day new photos only (incremental):

```bash
npm run deploy:photos
npm run deploy:photos -- --albums 20260301-Tokyo
```

Builds to `dist/` and uploads to `/var/www/zhihao.life/`.

## Content

| Path | Purpose |
|------|---------|
| `src/data/site.ts` | Name, bio, nav, social links |
| `src/data/publications.ts` | Paper list |
| `src/data/albums.ts` | Auto-discovered photo albums |
| `src/data/news.ts` | News items |
| `src/data/about.ts` | Education, interests, reels |
| `scripts/sync-photos.mjs` | Copy from photography library |
| `scripts/upload-photos.mjs` | Compress + upload albums to ECS |
| `scripts/deploy-remote.mjs` | One-click remote deploy |
