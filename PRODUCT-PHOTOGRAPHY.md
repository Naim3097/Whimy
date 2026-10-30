# Petals Heels: product photography guidelines

One brief for every product image in the shop: cards, tiles, the product page gallery, zoom, the set builder and the bag. The goal is one set that reads as a single session.

## 1. Where the images go

| Slot | Shape | Largest on screen | Notes |
|---|---|---|---|
| Product cards (collection, A's band, B's strip) | 4:5 | ~640 CSS px (B's strip on a 2560px screen) | The card's second image shows on hover |
| Product page gallery | 4:5; the desktop lead is cropped to 3:4 | 704 CSS px (lead), 348 px (half frames) | The 3:4 lead keeps 94% of a 4:5 frame's width. On a 2× screen the lead needs 1408 px of real detail |
| Zoom | the frame's own shape | up to source width ÷ 1.25 | Sharpness rule: never shown wider than source ÷ 1.25, so a 3000 px master zooms to 2400 px |
| Set builder, bag, checkout | 1:1 | 64–120 px | Cut from the centre of the 4:5 frame |

## 2. File specification

- **Master frame:** 4:5 portrait, 3000 × 3750 px. 2400 × 3000 px is the minimum.
- **Colour:** sRGB (IEC 61966-2.1), embedded.
- **Delivery:** 16-bit TIFF or PNG. A maximum-quality JPEG is the fallback. No WebP or HEIC: the build makes the web files (WebP, 480–1920 px).
- **Background:** a full rectangle on the backdrop, not a cut-out on transparency.
- **Names:** `petals-heels_<colour>_<nn>_<view>.tif`, using `rich-brown`, `blush-pink` and `sage-green`. For example `petals-heels_blush-pink_01_three-quarter.tif`.

## 3. The shot list (the same for every colour)

| # | View | Use |
|---|---|---|
| 01 | **Three-quarter front**, single left shoe, toe toward camera-left at about 30°, flower facing camera | Card, product page lead |
| 02 | **Side profile**, outer side, toe pointing left, heel and slingback fully visible | Card hover, gallery |
| 03 | **Pair from above**, toes up, 1 cm apart, parallel | Gallery |
| 04 | **Back view**, heel and slingback buckle centred | Gallery |
| 05 | **Flower macro**: organza layers, sheer edges visible | Gallery, zoom |
| 06 | **Insole**: whimy logo, straight on | Gallery |
| 07 | *(optional)* **On foot**: same model, legs only, same trouser, same pose per colour | Gallery, editorial |

Also shoot one **All three** frame: the three colours in the 01 view, fanned brown–pink–green left to right, same light. It is the set tile.

## 4. Framing: lock it off

Shoot every view from a tripod with the camera, lens and distance fixed. A shoe of the same size then lands in the same place in every colour.

- **Lens:** 90–105 mm macro (full-frame equivalent), so the pointed toe doesn't stretch. Never wider than 70 mm.
- **Camera height:** for views 01 and 02, level with the top of the heel cup, tilted down 5–10°. Use the same height for every colour.
- **Occupancy (views 01–04):** the shoe spans 68–72% of the frame width, centred.
- **Ground line:** the sole touches down at 74–76% of the height from the top, the same in every frame.
- **Safe area:** keep the whole shoe inside the centre 3000 × 3000 square, since the 1:1 thumbnails are cut from there. Leave at least 6% margin at the sides for the 3:4 lead crop.
- **Focus:** f/8–f/11 with focus stacking (3–5 frames), so toe, flower and heel are all sharp. Avoid shallow depth of field on packshots.

## 5. Background and surface

- **Backdrop:** one seamless paper or vinyl sweep, warm ivory. Target #EFE9DE (RGB 239, 233, 222), the site's `--ivory`.
  - The paper and ivory bands the cards sit on (#F8F5EF) are close, so the photograph reads as part of the page, not a sticker.
  - Ivory holds all three colours: the brown stands out, and the pink and green stay distinct with a soft contact shadow.
- **Evenness:** after grading, the backdrop measures within ±3 of the target on each channel across the frame. No visible vignette or gradient (the site's design rules ban gradients). Natural light falloff under 4% is fine.
- **Floor:** the same sweep, so there is no horizon line in packshots.
- **Not on the catalogue frames:**
  - Grass, the painted sky and props. Those belong to the campaign and editorial images, which already carry the brand world.
  - Shadows from props.
  - Mirrors or reflections.

## 6. Light

- **Key:** one large soft source (a 120 cm octabox or diffused strip), upper left, at about 10 o'clock and 45°. Use the same position for every colour and view, so light always falls from the left and the shadow to the right.
- **Fill:** a white bounce on the right, keeping shadow density low (about 1.5 stops under the key).
- **Satin:** keep the sheen as one long, soft highlight along the toe and vamp. Flag anything that clips; no hard hotspots. Check the histogram: no channel over 250 on the satin.
- **Organza:** a soft rim or back light (about 2 stops under the key), so the petals read as sheer, not flat.
- **Shadow:** one soft contact shadow under the sole and heel, kept, not cut out.
- **Colour temperature:** 5000–5600 K with all heads matched. Turn off room light and daylight, so the light doesn't mix.

## 7. Colour accuracy

- Shoot a ColorChecker (or grey card) at the start of each session and after any light change. Build one camera profile and one white balance from it.
- Compare each colour against the physical shoe under a 5000 K viewing light. Rich Brown, Blush Pink and Sage Green should match the real satin (ΔE under 3 if you can measure it). Never nudge a colour to look nicer than the shoe.
- Make one grade preset for the session and apply it to every frame in a batch. No per-image looks or filters.

## 8. Styling and retouching

- **Shoes:**
  - Use new, unworn shoes with clean soles; peel off price stickers.
  - Fasten the slingback buckle the same way in every colour and lay the strap to the same side.
  - Fluff each flower the same way, with the same layer facing camera.
  - Hide any tissue stuffing.
- **Retouch:** remove dust, threads, glue marks and creases in the backdrop.
- **Don't retouch:**
  - Never change shape, heel height, flower size, buckle or colour.
  - No added reflections.
  - No smoothing that hides the satin's texture.
- **Consistency check before delivery:** put all frames of one view (01 in all three colours, then 02, and so on) side by side at small size. They should line up: the same scale, ground line, light direction, shadow and backdrop tone. Re-shoot any that don't.

## 9. If any image is AI-generated

The site may not show misleading product images or invent product details. Catalogue images should be photographs of the real shoes.

If a visual is generated or AI-edited:
- **Base it on real photographs:** use image-to-image from real product photos, never a text prompt alone.
- **Check every detail against the shoe:** toe shape, flower (layers, sheerness, size), kitten heel height and shape, buckle and slingback.
- **Label it:** it will show the `AI visual` mark, as the homepage meadow does, so it is a poor fit for the catalogue.
- **Never use an upscaler on images with text:** the insole logo and printed cards get rewritten. The letter photograph's upscale was rejected for this.

## 10. Hand-off

- **Delivery:** a folder per colour, plus one for the set. Include the ColorChecker frame for reference.
- **Wiring in:** I'll add the files to the image script (`scripts/process-images.mjs`), which writes the web sizes to `public/images/whimy`. Then I'll list them per colour in `src/data/mock/products.ts`: 01 first, so it becomes the card image, and 02 second, for hover. The zoomed-in grass crops come out once the packshots arrive.
- **What stays:** the grass crops can stay on campaign and editorial surfaces such as B's doors, where Whimy's own photographs belong.
