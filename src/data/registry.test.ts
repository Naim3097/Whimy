import { describe, expect, it } from 'vitest';
import indexHtml from '../../index.html?raw';
import { allImages, conceptImages, conceptManifest, sampleImages, SHARPNESS_RATIO, stockImages, stockManifest, whimyImages, whimyManifest } from './assets';

const whimy = Object.values(whimyImages);

describe('image registry', () => {
  it('caps every manifest-backed image at floor(width / 1.25)', () => {
    for (const image of whimy) {
      const entry = whimyManifest[image.key];
      expect(entry, image.key).toBeDefined();
      expect(image.width, image.key).toBe(entry.width);
      expect(image.maxCssWidth, image.key).toBe(Math.floor(entry.width / SHARPNESS_RATIO));
    }
  });

  it('matches the resolution caps in DESIGN.md §6', () => {
    for (const image of [
      whimyImages.greenScalePlay,
      whimyImages.brownScalePlay,
      whimyImages.pinkReveal,
      whimyImages.groupThreeColours,
      whimyImages.brownSkyLegs,
      whimyImages.pairsGrid,
    ]) {
      expect(image.maxCssWidth, image.key).toBe(1536);
    }
    expect(whimyImages.bwLetter.maxCssWidth).toBe(819);
    // The giant crops fill B's half-width doors, so they are cut up to 2560px.
    expect(whimyImages.chocoGiant.maxCssWidth).toBe(1988);
    expect(whimyImages.kiwiGiant.maxCssWidth).toBe(2048);
  });

  it('records the original size of every upscaled photograph, and marks its crops', () => {
    const masters = whimy.filter((image) => whimyManifest[image.key].upscaledFrom);
    expect(masters.map((i) => i.key).sort()).toEqual([
      'brown-scale-play',
      'brown-sky-legs',
      'green-scale-play',
      'group-three-colours',
      'pairs-grid',
      'pink-reveal',
    ]);
    for (const image of masters) expect(image.upscaledFrom!.width, image.key).toBeLessThan(image.width);
    expect(whimyImages.chocoGrass.upscaledFrom).toEqual(whimyImages.groupThreeColours.upscaledFrom);
    expect(whimyImages.kiwiGiant.upscaledFrom).toEqual(whimyImages.greenScalePlay.upscaledFrom);
    expect(whimyImages.bwLetter.upscaledFrom).toBeUndefined();
  });

  it('preloads each homepage’s first image with the files it ships', () => {
    const preloads = [...indexHtml.matchAll(/\['(whimy|concept)', '([a-z-]+)', \[([\d, ]+)\], '([^']+)', '([^']*)'\]/g)];
    expect(preloads.map((m) => [m[1], m[2], m[4], m[5]])).toEqual([
      ['concept', 'meadow-wide', '100vw', '(min-width: 1024px), (min-aspect-ratio: 4/5)'],
      ['concept', 'meadow-tall', '100vw', '(width < 1024px) and (aspect-ratio < 4/5)'],
      ['whimy', 'brown-scale-play', '(min-width: 768px) 50vw, 100vw', ''],
    ]);
    for (const [, dir, key, widths] of preloads) {
      const manifest = dir === 'whimy' ? whimyManifest : conceptManifest;
      expect(widths.split(', ').map(Number), key).toEqual(manifest[key].sizes.map((s) => s.width));
    }
  });

  it('keeps stock photographs apart from Whimy’s, credited and named as stock', () => {
    const stock = Object.values(stockImages);
    expect(stock.map((i) => i.key).sort()).toEqual(Object.keys(stockManifest).sort());
    for (const image of stock) {
      expect(image.origin, image.key).toBe('stock');
      expect(image.src, image.key).toMatch(/^\/images\/stock\//);
      expect(image.alt, image.key).toMatch(/\(stock photograph\)$/);
      expect(image.credit?.source, image.key).toBe('Unsplash');
      expect(image.maxCssWidth, image.key).toBe(Math.floor(stockManifest[image.key].width / SHARPNESS_RATIO));
    }
  });

  it('keeps AI concept visuals apart from Whimy’s photographs, and marked', () => {
    const concepts = Object.values(conceptImages);
    expect(concepts.map((i) => i.key).sort()).toEqual(Object.keys(conceptManifest).sort());
    for (const image of concepts) {
      expect(image.origin, image.key).toBe('concept');
      expect(image.aiGenerated, image.key).toBe(true);
      expect(image.src, image.key).toMatch(/^\/images\/concept\//);
      expect(image.alt, image.key).toMatch(/^AI concept visual/);
      expect(image.dominant, image.key).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('registers every manifest entry, with a dominant colour', () => {
    const keys = whimy.map((i) => i.key).sort();
    expect(keys).toEqual(Object.keys(whimyManifest).sort());
    for (const image of whimy) expect(image.dominant, image.key).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('keeps sample imagery apart from Whimy’s own', () => {
    for (const image of whimy) {
      expect(image.origin, image.key).toBe('whimy');
      expect(image.world, image.key).not.toBe('sample');
      expect(image.src, image.key).toMatch(/^\/images\/whimy\//);
    }
    for (const image of Object.values(sampleImages)) {
      expect(image.origin, image.key).toBe('sample');
      expect(image.world, image.key).toBe('sample');
      expect(image.alt, image.key).toMatch(/\(sample image\)$/);
      expect(image.credit?.source, image.key).toBe('Unsplash');
      expect(image.src, image.key).not.toMatch(/crop=entropy/);
    }
  });

  it('keeps text-safe boxes and horizons inside the image', () => {
    for (const image of allImages) {
      if (image.textSafe) {
        const { x, y, w, h } = image.textSafe;
        expect(x >= 0 && y >= 0 && x + w <= 100 && y + h <= 100, image.key).toBe(true);
      }
      if (image.horizon != null) expect(image.horizon > 0 && image.horizon < 1, image.key).toBe(true);
    }
  });
});
