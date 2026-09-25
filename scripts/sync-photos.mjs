#!/usr/bin/env node
/**
 * Sync album folders from the photography library into src/assets/photos/.
 *
 * Folder convention: YYYYMMDD-Title (e.g. 20250608-Malmo)
 * New folders are picked up automatically by src/data/albums.ts on the next build.
 *
 * Usage:
 *   npm run sync:photos
 *   npm run sync:photos -- --albums 20250608-Malmo,20250418-Madrid
 *   npm run sync:photos -- --max-per-album 8
 *   PHOTO_SOURCE="F:/Pictures/作品集" npm run sync:photos
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

const IMAGE_RE = /\.(jpe?g|png|webp)$/i;
const DEFAULT_SOURCES = [
  '/mnt/f/Pictures/作品集',
  'F:/Pictures/作品集',
  '/mnt/f/Pictures/\u4f5c\u54c1\u96c6',
];

function parseArgs(argv) {
  const out = { albums: null, maxPerAlbum: null, clean: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--albums') out.albums = argv[++i]?.split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--max-per-album') out.maxPerAlbum = Number(argv[++i]);
    else if (a === '--clean') out.clean = true;
  }
  return out;
}

function resolveSource() {
  if (process.env.PHOTO_SOURCE && existsSync(process.env.PHOTO_SOURCE)) {
    return process.env.PHOTO_SOURCE;
  }
  for (const p of DEFAULT_SOURCES) {
    if (existsSync(p)) return p;
  }
  return null;
}

function listImages(dir) {
  return readdirSync(dir)
    .filter((name) => IMAGE_RE.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

const args = parseArgs(process.argv.slice(2));
const sourceRoot = resolveSource();
const destRoot = new URL('../src/assets/photos/', import.meta.url).pathname;

if (!sourceRoot) {
  console.error('Photo source not found. Set PHOTO_SOURCE or mount F:\\Pictures\\作品集.');
  process.exit(1);
}

mkdirSync(destRoot, { recursive: true });

if (args.clean) {
  for (const name of readdirSync(destRoot)) {
    const full = join(destRoot, name);
    if (statSync(full).isDirectory()) rmSync(full, { recursive: true, force: true });
  }
}

const albumDirs = readdirSync(sourceRoot)
  .filter((name) => {
    const full = join(sourceRoot, name);
    return statSync(full).isDirectory() && /^\d{8}-/.test(name);
  })
  .filter((name) => !args.albums || args.albums.includes(name))
  .sort((a, b) => b.localeCompare(a));

if (albumDirs.length === 0) {
  console.error('No album folders matched.');
  process.exit(1);
}

let copied = 0;
for (const album of albumDirs) {
  const fromDir = join(sourceRoot, album);
  const toDir = join(destRoot, album);
  let images = listImages(fromDir);
  if (args.maxPerAlbum && images.length > args.maxPerAlbum) {
    images = images.slice(0, args.maxPerAlbum);
  }
  if (images.length === 0) {
    console.warn(`skip empty: ${album}`);
    continue;
  }
  mkdirSync(toDir, { recursive: true });
  // Remove dest files not in this sync selection when limiting
  for (const existing of readdirSync(toDir)) {
    if (!images.includes(existing)) rmSync(join(toDir, existing), { force: true });
  }
  for (const file of images) {
    cpSync(join(fromDir, file), join(toDir, file));
    copied += 1;
  }
  console.log(`${album}: ${images.length} photos → src/assets/photos/${album}/`);
}

console.log(`Done. ${albumDirs.length} albums, ${copied} files from ${sourceRoot}`);
console.log('Rebuild or refresh the dev server to pick up new folders.');
