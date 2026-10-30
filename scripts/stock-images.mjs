// Builds the web files of the licensed stock photographs that stand in on brand surfaces.
// Usage: node scripts/stock-images.mjs
//
// assets-src/stock holds each original as downloaded (<key>.jpg). They are not Whimy's
// photographs, so they live apart from Whimy's files: public/images/stock and their own
// manifest, and every placement marks them `stock photo`. Each gets a light grade (GRADES)
// so its sky sits in the same air as the meadow and the satin film, then WebP files up to
// 3200px wide. Re-running is safe.
import sharp from 'sharp';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

const MASTERS = resolve('assets-src/stock');
const OUT_DIR = resolve('public/images/stock');
const MANIFEST = resolve('src/data/stock-image-manifest.json');
const WIDTHS = [480, 960, 1440, 1920, 2560, 3200];

/**
 * Per key: saturation, then a per-channel gain. The KLCC sky measured 155,198,231 against the
 * meadow's 159,192,220 and the satin's 173,193,211: a touch cooler and more saturated. These
 * close the gap without making the steel look treated.
 */
const GRADES = {
  'klcc-towers': { saturation: 0.88, gain: [1, 0.98, 0.975] },
};

const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

await mkdir(OUT_DIR, { recursive: true });
const manifest = JSON.parse(await readFile(MANIFEST, 'utf8').catch(() => '{}'));

for (const file of (await readdir(MASTERS)).filter((f) => f.endsWith('.jpg')).sort()) {
  const key = basename(file, '.jpg');
  const grade = GRADES[key];
  if (!grade) throw new Error(`${file}: add its grade to GRADES`);
  const graded = await sharp(join(MASTERS, file))
    .modulate({ saturation: grade.saturation })
    .linear(grade.gain, [0, 0, 0])
    .png()
    .toBuffer();

  const sizes = [];
  for (const w of WIDTHS) {
    const { data, info } = await sharp(graded).resize({ width: w, withoutEnlargement: true }).webp({ quality: 80, effort: 5 }).toBuffer({ resolveWithObject: true });
    const name = `${key}-${info.width}.webp`;
    if (sizes.some((s) => s.file === name)) break;
    await writeFile(join(OUT_DIR, name), data);
    sizes.push({ file: name, width: info.width, height: info.height, bytes: info.size });
  }
  for (const old of manifest[key]?.sizes ?? []) {
    if (!sizes.some((s) => s.file === old.file)) await rm(join(OUT_DIR, old.file), { force: true });
  }

  const { dominant } = await sharp(graded).stats();
  const largest = sizes[sizes.length - 1];
  manifest[key] = { width: largest.width, height: largest.height, dominant: hex(dominant), sizes };
  console.log(key, sizes.map((s) => `${s.width} (${Math.round(s.bytes / 1024)}k)`).join(', '));
}

await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Manifest updated.');
