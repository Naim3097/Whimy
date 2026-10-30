// Builds the web files of the AI concept visuals made for this preview.
// Usage: node scripts/concept-images.mjs
//
// assets-src/concept holds one PNG per key, made with Higgsfield from the generated
// originals: the meadow's tall frame a 4K upscale, its wide frame an outpaint (zoomed
// out 1.35x, so her head clears the clear header); the packshots for homepage B's
// strip as supplied (1122px, enough for its quarter-width tiles). They are not Whimy's photographs, so they live apart
// from Whimy's files: public/images/concept and their own manifest. For each,
// this writes WebP files up to 3200px wide (a full-bleed campaign on large and
// high-density screens), removes the key's older sizes and records its dominant
// colour. `upscaledFrom` or `extendedFrom` keeps the generated original's size. Re-running is safe.
import sharp from 'sharp';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

const MASTERS = resolve('assets-src/concept');
const OUT_DIR = resolve('public/images/concept');
const MANIFEST = resolve('src/data/concept-image-manifest.json');
const WIDTHS = [480, 960, 1440, 1920, 2560, 3200];

/** The generated originals' sizes, and what was done to them (nothing, for the packshots). */
const ORIGINALS = {
  'meadow-wide': { width: 1672, height: 941, made: 'extendedFrom' },
  'meadow-tall': { width: 1122, height: 1402, made: 'upscaledFrom' },
  'packshot-rich-brown': { width: 1122, height: 1402, made: null },
  'packshot-blush-pink': { width: 1122, height: 1402, made: null },
  'packshot-sage-green': { width: 1122, height: 1402, made: null },
  'packshot-trio': { width: 1122, height: 1402, made: null },
};

const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

await mkdir(OUT_DIR, { recursive: true });
const manifest = JSON.parse(await readFile(MANIFEST, 'utf8').catch(() => '{}'));

for (const file of (await readdir(MASTERS)).filter((f) => f.endsWith('.png')).sort()) {
  const key = basename(file, '.png');
  if (!ORIGINALS[key]) throw new Error(`${file}: add its original size to ORIGINALS`);
  const input = join(MASTERS, file);

  const sizes = [];
  for (const w of WIDTHS) {
    const { data, info } = await sharp(input).resize({ width: w, withoutEnlargement: true }).webp({ quality: 78, effort: 5 }).toBuffer({ resolveWithObject: true });
    const name = `${key}-${info.width}.webp`;
    if (sizes.some((s) => s.file === name)) break;
    await writeFile(join(OUT_DIR, name), data);
    sizes.push({ file: name, width: info.width, height: info.height, bytes: info.size });
  }
  for (const old of manifest[key]?.sizes ?? []) {
    if (!sizes.some((s) => s.file === old.file)) await rm(join(OUT_DIR, old.file), { force: true });
  }

  const { dominant } = await sharp(input).stats();
  const largest = sizes[sizes.length - 1];
  const { made, ...original } = ORIGINALS[key];
  manifest[key] = { width: largest.width, height: largest.height, dominant: hex(dominant), sizes, ...(made ? { [made]: original } : null) };
  console.log(key, `${ORIGINALS[key].width}px ->`, sizes.map((s) => `${s.width} (${Math.round(s.bytes / 1024)}k)`).join(', '));
}

await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Manifest updated.');
