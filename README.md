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

# or only some albums / cap photos per album while testing
npm run sync:photos -- --albums 20250608-Malmo,20250418-Madrid --max-per-album 8
npm run sync:photos -- --clean   # replace local copies
```

Override the source path if needed:

```bash
PHOTO_SOURCE="/mnt/f/Pictures/作品集" npm run sync:photos
```

`src/data/albums.ts` scans `src/assets/photos/*` at build time — new folders appear under Portfolio automatically. Album pages use PhotoSwipe (click to enlarge, arrow keys / on-screen arrows to browse).

## Build & deploy

```bash
./deploy.sh
```

Builds to `dist/` and rsyncs to `/var/www/zhihao.life/`. Sync photos on the build machine before deploying.

## Content

| Path | Purpose |
|------|---------|
| `src/data/site.ts` | Name, bio, nav, social links |
| `src/data/publications.ts` | Paper list |
| `src/data/albums.ts` | Auto-discovered photo albums |
| `src/data/news.ts` | News items |
| `src/data/about.ts` | Education, interests, reels |
| `scripts/sync-photos.mjs` | Copy from photography library |
