// Converts Whimy's source photos into responsive WebP files + a manifest.
// Usage: node scripts/process-images.mjs <sourceDir>
//        node scripts/process-images.mjs --lockup
// Source files are expected as <name>.jpg (see SOURCES below).
// The manifest records each image's source size and its dominant colour,
// which the storefront paints while the image loads.
// --lockup rebuilds only the small monogram-coin files, in place, from the
// largest coin file already in public/images (no source JPEGs needed, and
// file names, sizes and the manifest stay as they are).
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Usage: node scripts/process-images.mjs <sourceDir> | --lockup');
  process.exit(1);
}

const OUT_DIR = resolve('public/images/whimy');
const WIDTHS = [480, 960, 1440];

/** name -> optional crop (pixels in the source image) */
const SOURCES = {
  'group-three-colours': null,
  'brown-scale-play': null,
  'brown-sky-legs': null,
  'pink-reveal': null,
  'green-scale-play': null,
  'bw-letter': null,
  'kl-patches': null,
  'guess-teaser': null,
  'pointe-pretty': null,
  'save-the-date': null,
  'pairs-grid': null,
};

/** Extra crops derived from a source image. Brand marks stay raster crops until Whimy supplies vectors. */
const DERIVED = {
  'monogram-coin': { from: 'kl-patches', crop: { left: 417, top: 1786, width: 690, height: 690 }, widths: [96, 192, 384], lockup: [96, 192] },
  'kl-flower': { from: 'kl-patches', crop: { left: 1122, top: 1786, width: 708, height: 708 }, widths: [96, 192, 384] },
  'patches-trio': { from: 'kl-patches', crop: { left: 400, top: 1350, width: 1440, height: 1150 }, widths: [480, 960] },
  'insole-detail': { from: 'guess-teaser', crop: { left: 397, top: 159, width: 330, height: 328 }, widths: [330] },
};

/**
 * The header lockup shows the coin at 28-32px, where an embroidered champagne W
 * on a champagne coin blurs into a plain disc on DPR1 screens. The small coin
 * files (the only ones the lockup's srcset picks) get a firm unsharp mask on
 * lightness after resizing, which draws the W's stitched outline. A brand-mark
 * derivative, not a photograph: the "photos untouched" rule doesn't apply. Retire
 * it when Whimy supplies the vector coin (DESIGN.md §5, shot list item 4).
 */
const LOCKUP_SHARPEN = { sigma: 0.6, m1: 0, m2: 4, x1: 0, y2: 30, y3: 30 };

const hex = ({ r, g, b }) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

async function dominant(pipeline) {
  const { dominant: colour } = await pipeline.stats();
  return hex(colour);
}

function encode(pipeline, width, lockup) {
  const resized = pipeline.resize({ width, withoutEnlargement: true });
  return lockup ? resized.sharpen(LOCKUP_SHARPEN).webp({ quality: 88, effort: 6 }) : resized.webp({ quality: 78, effort: 5 });
}

async function emit(name, pipelineFactory, srcWidth, widths, lockupWidths = []) {
  const outputs = [];
  for (const w of widths) {
    const width = Math.min(w, srcWidth);
    if (outputs.some((o) => o.width === width)) break;
    const file = `${name}-${width}.webp`;
    const info = await encode(pipelineFactory(), width, lockupWidths.includes(width)).toFile(join(OUT_DIR, file));
    outputs.push({ file, width: info.width, height: info.height, bytes: info.size });
  }
  return outputs;
}

if (sourceDir === '--lockup') {
  const { widths, lockup } = DERIVED['monogram-coin'];
  const largest = join(OUT_DIR, `monogram-coin-${Math.max(...widths)}.webp`);
  // Read once into memory, so no output can overwrite the file it is read from.
  const input = await sharp(largest).toBuffer();
  for (const width of lockup) {
    const info = await encode(sharp(input), width, true).toFile(join(OUT_DIR, `monogram-coin-${width}.webp`));
    console.log(`monogram-coin-${width}.webp`, info.width, 'x', info.height, info.size, 'bytes');
  }
  process.exit(0);
}

await mkdir(OUT_DIR, { recursive: true });
const manifest = {};

for (const name of Object.keys(SOURCES)) {
  const input = join(sourceDir, `${name}.jpg`);
  const meta = await sharp(input).metadata();
  const outputs = await emit(name, () => sharp(input).rotate(), meta.width, WIDTHS);
  const colour = await dominant(sharp(input).rotate());
  manifest[name] = { width: meta.width, height: meta.height, dominant: colour, sizes: outputs };
  console.log(name, meta.width, 'x', meta.height, colour, '->', outputs.map((o) => o.file).join(', '));
}

for (const [name, spec] of Object.entries(DERIVED)) {
  const input = join(sourceDir, `${spec.from}.jpg`);
  const outputs = await emit(name, () => sharp(input).rotate().extract(spec.crop), spec.crop.width, spec.widths, spec.lockup);
  // stats() reads the input, so the crop is materialised first.
  const crop = await sharp(input).rotate().extract(spec.crop).png().toBuffer();
  const colour = await dominant(sharp(crop));
  manifest[name] = { width: spec.crop.width, height: spec.crop.height, dominant: colour, sizes: outputs };
  console.log(name, colour, '->', outputs.map((o) => o.file).join(', '));
}

await writeFile(resolve('src/data/whimy-image-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Manifest written.');
