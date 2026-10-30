// Rebuilds the web files of the photographs that have an upscaled master.
// Usage: node scripts/upscaled-images.mjs   (then `npm run crops`, since crops cut from these)
//
// Whimy's Instagram files are 880-1056px wide: soft on large and high-density
// screens. assets-src/upscaled holds Higgsfield 4K upscales of five of them, one
// PNG per manifest key. For each, this writes WebP files up to 1920px wide,
// removes the key's older sizes, and updates its manifest entry. `upscaledFrom`
// keeps the size of Whimy's original file, so the credits can say what was
// upscaled and from what. Re-running is safe.
import sharp from 'sharp';
import { readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

const MASTERS = resolve('assets-src/upscaled');
const OUT_DIR = resolve('public/images/whimy');
const MANIFEST = resolve('src/data/whimy-image-manifest.json');
const WIDTHS = [480, 960, 1440, 1920];

const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));

for (const file of (await readdir(MASTERS)).filter((f) => f.endsWith('.png')).sort()) {
  const key = basename(file, '.png');
  const entry = manifest[key];
  if (!entry) throw new Error(`${file}: no manifest entry named ${key}`);
  const input = join(MASTERS, file);

  const sizes = [];
  for (const w of WIDTHS) {
    const info = await sharp(input).resize({ width: w, withoutEnlargement: true }).webp({ quality: 78, effort: 5 }).toFile(join(OUT_DIR, `${key}-${w}.webp`));
    sizes.push({ file: `${key}-${w}.webp`, width: info.width, height: info.height, bytes: info.size });
  }
  for (const old of entry.sizes) {
    if (!sizes.some((s) => s.file === old.file)) await rm(join(OUT_DIR, old.file), { force: true });
  }

  const { dominant } = await sharp(input).stats();
  const largest = sizes[sizes.length - 1];
  manifest[key] = {
    width: largest.width,
    height: largest.height,
    dominant: hex(dominant),
    sizes,
    upscaledFrom: entry.upscaledFrom ?? { width: entry.width, height: entry.height },
  };
  console.log(key, `${manifest[key].upscaledFrom.width}px ->`, sizes.map((s) => `${s.width} (${Math.round(s.bytes / 1024)}k)`).join(', '));
}

await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Manifest updated.');
