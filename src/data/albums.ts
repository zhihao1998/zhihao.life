import type { ImageMetadata } from 'astro';

export type AlbumPhoto = {
  src: ImageMetadata;
  alt: string;
  filename: string;
};

export type Album = {
  slug: string;
  folder: string;
  title: string;
  location: string;
  date: string;
  year: number;
  cover: ImageMetadata;
  photos: AlbumPhoto[];
};

const modules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/photos/**/*.{jpg,jpeg,JPG,JPEG,png,webp,PNG,WEBP}',
  { eager: true },
);

function slugifyFolder(folder: string) {
  return folder
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fff-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseFolder(folder: string) {
  const match = folder.match(/^(\d{4})(\d{2})(\d{2})-(.+)$/);
  if (!match) {
    return {
      date: '',
      year: 0,
      title: folder,
      location: folder,
    };
  }
  const [, y, m, d, rest] = match;
  return {
    date: `${y}-${m}-${d}`,
    year: Number(y),
    title: rest.trim(),
    location: rest.trim(),
  };
}

type Bucket = {
  folder: string;
  photos: { filename: string; src: ImageMetadata }[];
};

const buckets = new Map<string, Bucket>();

for (const [path, mod] of Object.entries(modules)) {
  const parts = path.split('/');
  const filename = parts.at(-1);
  const folder = parts.at(-2);
  if (!filename || !folder || folder === 'photos') continue;
  const src = mod.default;
  if (!src) continue;
  const bucket = buckets.get(folder) ?? { folder, photos: [] };
  bucket.photos.push({ filename, src });
  buckets.set(folder, bucket);
}

export const albums: Album[] = [...buckets.values()]
  .map((bucket) => {
    const meta = parseFolder(bucket.folder);
    const photos = bucket.photos
      .sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }))
      .map((p) => ({
        src: p.src,
        filename: p.filename,
        alt: `${meta.title} — ${p.filename.replace(/\.[^.]+$/, '')}`,
      }));

    return {
      slug: slugifyFolder(bucket.folder),
      folder: bucket.folder,
      title: meta.title,
      location: meta.location,
      date: meta.date,
      year: meta.year,
      cover: photos[0]!.src,
      photos,
    } satisfies Album;
  })
  .filter((album) => album.photos.length > 0)
  .sort((a, b) => b.folder.localeCompare(a.folder));

/**
 * Build-time hero pool: landscape frames first, then one cover from
 * portrait-only albums. Capped so the carousel stays light.
 */
export function pickHeroImages(
  list = albums,
  {
    minLandscapeRatio = 1.05,
    maxSlides = 6,
  }: { minLandscapeRatio?: number; maxSlides?: number } = {},
): ImageMetadata[] {
  const landscapes: { album: Album; photo: AlbumPhoto; ratio: number }[] = [];
  const portraitCovers: { album: Album; photo: AlbumPhoto }[] = [];

  for (const album of list) {
    let albumHasLandscape = false;
    for (const photo of album.photos) {
      const ratio = photo.src.width / photo.src.height;
      if (ratio >= minLandscapeRatio) {
        landscapes.push({ album, photo, ratio });
        albumHasLandscape = true;
      }
    }
    if (!albumHasLandscape && album.photos[0]) {
      portraitCovers.push({ album, photo: album.photos[0] });
    }
  }

  landscapes.sort((a, b) => {
    const byAlbum = b.album.folder.localeCompare(a.album.folder);
    if (byAlbum !== 0) return byAlbum;
    return a.photo.filename.localeCompare(b.photo.filename, undefined, {
      numeric: true,
    });
  });

  const picks: ImageMetadata[] = [];
  const seen = new Set<string>();

  const push = (src: ImageMetadata) => {
    const key = src.src;
    if (seen.has(key) || picks.length >= maxSlides) return;
    seen.add(key);
    picks.push(src);
  };

  // Round-robin across albums so one city does not dominate.
  const byAlbum = new Map<string, ImageMetadata[]>();
  for (const item of landscapes) {
    const bucket = byAlbum.get(item.album.folder) ?? [];
    bucket.push(item.photo.src);
    byAlbum.set(item.album.folder, bucket);
  }
  const albumOrder = [...byAlbum.keys()].sort((a, b) => b.localeCompare(a));
  let added = true;
  while (added && picks.length < maxSlides) {
    added = false;
    for (const folder of albumOrder) {
      const bucket = byAlbum.get(folder);
      const next = bucket?.shift();
      if (!next) continue;
      const before = picks.length;
      push(next);
      if (picks.length > before) added = true;
      if (picks.length >= maxSlides) break;
    }
  }

  for (const item of portraitCovers) {
    if (picks.length >= maxSlides) break;
    push(item.photo.src);
  }

  if (picks.length === 0 && list[0]?.cover) {
    picks.push(list[0].cover);
  }
  return picks;
}

/** Regenerated on each build from src/assets/photos (after npm run sync:photos). */
export const heroImages = pickHeroImages();
export const heroImage: ImageMetadata | undefined = heroImages[0];

export function getAlbum(slug: string) {
  return albums.find((a) => a.slug === slug);
}

/** Newest album covers for the home preview grid. */
export function featuredPhotos(limit = 8) {
  const picks: { photo: AlbumPhoto; album: Album }[] = [];
  for (const album of albums) {
    const photo = album.photos[0];
    if (!photo) continue;
    picks.push({ photo, album });
    if (picks.length >= limit) break;
  }
  return picks;
}
