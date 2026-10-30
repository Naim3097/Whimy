// Cuts art-directed crops from Whimy's photographs and adds them to the manifest.
// Usage: node scripts/derive-crops.mjs
//
// A crop is cut from the photograph's upscaled master in assets-src/upscaled when
// there is one, otherwise from the largest WebP in public/images/whimy (the
// original JPEGs are not in the repo). Boxes are in the pixels of Whimy's original
// file and are scaled to the master, so they stay put whichever source is used.
// Outputs are never wider than the box, so a crop is never enlarged. Re-run after
// `npm run images` or `npm run images:upscaled`.
//   - The three product crops come from one photograph (all three colours on the
//     grass), so the product tiles share one light and one ground.
//   - The two giant-heel crops come from the scale-play reveals, up to 2560px wide:
//     they fill homepage B's half-width doors, 4:5 boxes that cover a landscape crop.
import sharp from 'sharp';
import { access, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const DIR = resolve('public/images/whimy');
const MASTERS = resolve('assets-src/upscaled');
const MANIFEST = resolve('src/data/whimy-image-manifest.json');

/**
 * name -> source manifest key, crop box in the original's pixels, output widths.
 * The three product crops hold one colour each (the group shot crowds them): the
 * brown shoe whole, with sky above (its toe meets the photograph's own left edge);
 * one pink shoe whole with its pair behind; the green shoe standing on the grass.
 */
const CROPS = {
  'choco-grass': { from: 'group-three-colours', box: { left: 0, top: 342, width: 353, height: 441 }, widths: [480, 960, 1440] },
  'strawberry-grass': { from: 'group-three-colours', box: { left: 262, top: 770, width: 300, height: 375 }, widths: [480, 960, 1440] },
  'kiwi-grass': { from: 'group-three-colours', box: { left: 669, top: 538, width: 243, height: 304 }, widths: [480, 960, 1440] },
  'strawberry-sky': { from: 'pink-reveal', box: { left: 0, top: 200, width: 480, height: 600 }, widths: [480, 960, 1440] },
  'choco-giant': { from: 'brown-scale-play', box: { left: 200, top: 700, width: 824, height: 660 }, widths: [480, 960, 1440, 1920, 2560] },
  'kiwi-giant': { from: 'green-scale-play', box: { left: 0, top: 480, width: 1056, height: 912 }, widths: [480, 960, 1440, 1920, 2560] },
};

const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
const exists = (path) => access(path).then(() => true, () => false);

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));

for (const [name, spec] of Object.entries(CROPS)) {
  const source = manifest[spec.from];
  if (!source) throw new Error(`No manifest entry for ${spec.from}`);
  const original = source.upscaledFrom ?? source;
  const master = join(MASTERS, `${spec.from}.png`);
  let input;
  if (await exists(master)) {
    input = master;
  } else {
    const largest = [...source.sizes].sort((a, b) => b.width - a.width)[0];
    if (largest.width !== source.width) throw new Error(`${spec.from}: the largest file (${largest.width}) is not the source size (${source.width})`);
    input = join(DIR, largest.file);
  }
  const { width, height } = await sharp(input).metadata();
  const kx = width / original.width;
  const ky = height / original.height;
  const box = {
    left: Math.round(spec.box.left * kx),
    top: Math.round(spec.box.top * ky),
    width: Math.min(Math.round(spec.box.width * kx), width - Math.round(spec.box.left * kx)),
    height: Math.min(Math.round(spec.box.height * ky), height - Math.round(spec.box.top * ky)),
  };
  const cut = await sharp(input).extract(box).png().toBuffer();

  const sizes = [];
  for (const w of spec.widths) {
    const info = await sharp(cut).resize({ width: w, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toBuffer({ resolveWithObject: true });
    const file = `${name}-${info.info.width}.webp`;
    if (sizes.some((s) => s.file === file)) break;
    await writeFile(join(DIR, file), info.data);
    sizes.push({ file, width: info.info.width, height: info.info.height, bytes: info.info.size });
  }
  for (const old of manifest[name]?.sizes ?? []) {
    if (!sizes.some((s) => s.file === old.file)) await rm(join(DIR, old.file), { force: true });
  }

  const { dominant } = await sharp(cut).stats();
  const largest = sizes[sizes.length - 1];
  manifest[name] = { width: largest.width, height: largest.height, dominant: hex(dominant), sizes, from: spec.from };
  console.log(name, `${box.width}x${box.height} from ${input === master ? 'master' : 'webp'}`, hex(dominant), '->', sizes.map((s) => `${s.width} (${Math.round(s.bytes / 1024)}k)`).join(', '));
}

await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Manifest updated.');
