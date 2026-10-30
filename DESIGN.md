# WHIMY: DESIGN.md

Two homepage concepts for one storefront, each taken from a live reference site and translated into Whimy's own photographs, voice and colours. Everything after the homepage (collection, product, bag, checkout, help, story) is one shared shop.

This file replaces the earlier "Big Little Things" spec. That build's signature interaction (the Line-up and, before it, the Bloom Stage: colour spotlights and tags on the group photograph) was **cancelled by the client and removed**. Nothing here brings it back in another form.

---

## 1. Decisions

- **Reference fidelity over novelty.** Each homepage follows what its reference site actually does, measured on 30 Oct 2026 (§2). No signature gimmick replaces the cancelled interaction.
- **Whimy's identity stays.** IM Fell English italic (the face of Whimy's own teasers) is the voice in both concepts; Libre Franklin is the working face; the palette is sampled from Whimy's patches and product.
- **One shop, two chromes.** The concept last visited dresses the bar, header and footer of every shared page, so a client walk-through stays inside one concept from homepage to checkout. Bag, Saved and orders are shared.
- **Real photographs only on brand surfaces.** Whimy's 11 Instagram images plus crops cut from them (§6). Stock images appear only on `/preview/catalogue`. Exceptions, always marked: B's campaign opens on an AI concept visual made for this preview, its strip shows AI packshots (`AI visual`, §5), and its KL scene is a stock photograph (`stock photo`).
- **Honest by default.** Unknown facts read `tbc`, demo values read `sample` (§7).

---

## 2. What the references do (measured)

| | Christy Ng (christyng.com) → Concept A | Jimmy Choo (jimmychoo.com) → Concept B |
|---|---|---|
| Type | Roboto 400/500. Titles in capitals (hero 32px/500, sections 24px/500, tiles 18px/500), 12px tracked caps for buttons and the bar | Franklin Gothic 400/600 only, 12/14/16/18px. Sentence case; capitals only on underlined CTAs |
| Bar | 37px #C0848E, one static linked message in tracked caps | 26px #212121, store link, rotating message with a chevron, market |
| Header | Hamburger, centred wordmark, bag glyph; clear over the hero, white from the first scroll | Menu + Search words and glyphs, wordmark, Wishlist / Sign in / Bag; clear over the hero; hides on scroll down, returns on scroll up |
| Hero | Slideshow, one product per slide; caption box (max 400px) centred in the image's empty third: caps title, one line, white 45px box | 16:9 carousel (image + muted video); caption bottom-left: 18px/600 title, 14px line, underlined caps link; segmented progress bars |
| Next | Four full-height category doors; title top-right; the hovered door widens 1 → 3 over 1s | Product strip: 4:5 tiles, 4px seams |
| Products | Centred caps heading on a #F4F4F4 band, packshots, caps names, black "View more" | 50/50 showcase: grey panel with a centred heading + one-product carousel, beside a 4:5 image |
| Editorial | 2×2 full-bleed grid, centred caps title + white box that inverts on hover; an inset framed banner | 50/50 4:5 doors with sticky bottom-left CTAs; one 16:9 full-bleed banner |
| Close | Press logos, blog cards and a store locator in inset #F7F7F7 panels; rose footer (Info / About / Subscribe) | Text-only "Exclusive Services" row between hairlines; #F6F6F6 footer, newsletter left, four columns right |
| Colour | Rose only on the bar and footer | None in the UI; the photographs carry it |
| Listing | Centred caps title, filter toggle, 4-up grid of pale tiles, 5px gutters | Small centred title, sticky filter bar with count and sort, 4-up tiles, 4px gutters |
| Product | 50/50; one-image gallery with "1 of 5"; centred buy column | Stacked gallery beside a sticky buy box; "Select size" → "Add to bag – 37" |

What we deliberately did **not** take: Christy Ng's discount pop-up, side tab and chat bubble; its desktop nav hidden behind a hamburger at 1440 (kept, but the menu is a full drawer); Jimmy Choo's four simultaneous autoplays, white type over pale image areas, and image-only product tiles without names or prices.

---

## 3. Shared foundations (`src/styles/tokens.css`)

**Colour.** `--paper #F8F5EF` (page), `--ivory #EFE9DE` (tiles, bands, panels), `--champagne #D7C5A5` (hairlines), `--ink #251107` (Rich Brown's deepest shade: all text), `--ink-2 #6E5C4E`, `--action #744630` (Rich Brown: the primary button), swatches `--swatch-choco / -strawberry / -kiwi`, `--rose-deep #D5A6AA` (Concept A's band), `--error #A3361F`.

**Type.**
- `--font-ui`: **Libre Franklin** (variable, Fontsource). A free Franklin Gothic revival: the face Jimmy Choo uses, and the plain grotesque role Roboto plays for Christy Ng. 12–26px.
- `--font-voice`: **IM Fell English** italic and Roman. Whimy's own teaser face ("Something Pointe & Pretty"). Nicknames, slide lines, the letter, the wordmark.
- `--font-sc`: IM Fell English SC, rare labels.
- Concept tokens: `--a-hero`, `--a-heading`, `--b-title 18px`, `--b-text 14px`, `--caps-tracking 0.08em`.

**Shape.** Square everywhere (both references). Hairlines 1px.

**Actions.** `.btn` (solid Rich Brown, commerce), `.btn--secondary`; `.btn-box` (A: white 45px box, caps, ink on hover) and `.btn-box--ink`; `.cta-line` (B: 12px caps, 1px underline that lifts on hover); `.link`.

**Motion.** Transitions between states only; `@keyframes` stay banned by the CSS guard. Durations 120 / 200 / 320 / 600ms; A's slideshow slides over 800ms (Christy Ng), B's header slides over 300ms (Jimmy Choo), A's doors widen over 1s (Christy Ng). `prefers-reduced-motion` zeroes the slides and stops autoplay. Every autoplay has a pause.

---

## 4. Concept A: `/concept-a` (after Christy Ng)

1. **Bar**: `--rose-deep` band, "Shop the Petals Collection" in 12px tracked caps, the whole bar a link. The presentation switch sits at its end from 768px.
2. **Header**: Christy Ng's 50px at every width (`:root[data-concept=a]`), solid paper (the slideshow's colour fields would fight a clear header); menu glyph, centred `whimy` in Fell Roman, search and bag glyphs.
3. **Slideshow**: one slide per colour. Whimy's portraits fill one half; the colourway's own satin fills the other, where the caption box sits: "Petals Heels in Rich Brown" (caps 32px/500), one of Whimy's own lines in the Fell italic, a white box "Shop choco". 5s autoplay (Christy Ng's), 800ms slide; it holds while the pointer or focus is anywhere inside it (Play resumes it there), stops when a dot is used or a phone swipes, and its Pause/Play comes first in the reading order. Each slide has its own crop (`position`) so the shoe is always in frame, and a second one for tablets (768–1023px), where each half is a tall slice about 60% of the photograph's width (`narrow`: the whole Rich Brown shoe at `72% 100%`). Phones: photo above, field below; the controls sit at the top of the field, just under the photograph, so they show in the first screen, in the field's ink.
4. **Doors**: The Petals Collection · Size & fit · Dear Whimy Babes · Next bloom; full-bleed, as tall as the screen under the header (Christy Ng's), the title top-right on a small paper ground (Christy Ng's white box) whose measure follows the screen, not the door, so its words never re-wrap as the doors widen: the photographs re-crop as the doors widen, and no corner stays light at every width (bare ink measured as low as 0.9:1 on phones). From 1024px the door under the pointer or focus widens to three parts over 1s. Keyboard focus draws a paper-and-ink ring on a layer above the photograph. Below 1024px: 2 × 2 tiles with the words centred under each photograph (a paper box would cover too much of a small tile).
5. **Product band**: ivory band, "The Petals Collection" + "petals, satin, pointe. One kitten heel in three colours." Three tiles cut from one photograph (`*-grass` crops), caps names, nickname · name, price; "View the collection". Phones: one tile per swipe.
6. **Editorial pair**: Whimy's own TikTok question, "Brown lover" / "Pink lover", over the two painted-sky photographs. The shoes fill the top of each, so the captions sit low on the trousers and grass: 24px paper capitals (large text: 4.7:1 or more on the brown, 4.0:1 or more on the pink's satin trousers, against 3:1 needed, from 390 to 1440px) over white boxes. Below 1024px the panels are 3:4, the photographs' own shape, so no shoe is cut at the sides.
7. **Insets**: two panels 60px apart, 48px inside. "From @whimy.official": three of Whimy's first posts, whole at Instagram's 4:5, each to Instagram; the AI-labelled post says so under its title, and the three links share a baseline. "Where to find Whimy" (Kuala Lumpur, online, TikTok Shop announced, DMs) beside the KL visual cropped to the patch trio.
8. **Footer**: the rose band; Info · Shop · About · Subscribe; legal line (`tbc`) and the homepage switch, centred; payment methods (`sample`) on a line of their own. Marks take the band's ink there (olive falls to 3:1 on rose).

## 5. Concept B: `/`, the default (after Jimmy Choo)

1. **Utility bar**: 26px, as Jimmy Choo's (`--b-bar-h`; its links and buttons fill it: 25–26px targets); Rich Brown's darkest shade; "Delivery & exchanges" · one rotating message (5s cross-fade, holds on hover/focus, Next, and a keyboard-only Stop that turns into Resume) · "Malaysia (RM)". The messages share one slot as wide as the longest, so the Next arrow never moves; the ends keep their width and the slot takes what is left, so nothing overlaps at 768px. Each message is short enough for a 320px phone's slot (244px), so none is cut. A message the shopper moves to with Next is announced (`role="status"`); the automatic turn stays silent.
2. **Header**: clear over the campaign with **ink** words (the campaign opens on a pale sky, where white would not read: 7.6:1 or more for ink, 360–2560px). The meadow is framed so her head sits below the header's words, with nothing laid over it. 14px/600 words beside Jimmy Choo's 24px glyphs (the bag count 600 too); solid once past 70% of the first screen; hides on scroll down and returns on scroll up (300ms); focus inside it brings it back.
3. **Campaign**: Jimmy Choo's hero, a still slide and a film slide. They move sideways (500ms, 6s each); two bars along the foot (4px, 2px on phones) fill in ink over each slide's time (Web Animations, holding with the slides); pause and the arrows sit bottom-right (Jimmy Choo keeps its film's pause bottom-left; here it joins the arrows so the caption's corner stays clear). The meadow's foot is clover, grass blades and white quilt, where neither ink nor paper holds (1.6–2.6:1 measured), so the controls bring their own ground: the buttons sit on a paper plate and the bars run on a paper track. As the WAI-ARIA carousel pattern asks, the slides hold while focus is anywhere inside (pressing Play resumes them there), stop for good when an arrow, a bar or a swipe is used, and are announced (`aria-live`) only once they stop turning on their own. One Pause stops everything, film included; under reduced motion nothing moves until Play. Below 400px the arrows give way to the caption (swipe or tap a bar). Below 1024px the campaign is 3:4 but never taller than the screen under the bar (so the bars show on an iPad held upright); each slide stands on its foot, so a shorter campaign cuts sky, not the shoes. From 1024px it is Jimmy Choo's 16:9 where the screen allows (the strip peeking in below), never shorter than 50vw.
   - **Still slide**: one full-bleed AI concept visual supplied for this preview: a model in a lime faux-fur jacket and sage organza on a pale quilt in a clover meadow, wearing Rich Brown slingbacks. Marked `AI visual` in its caption and credited on `/credits`; its heels are an impression of Petals Heels, not a product photograph. Two generations of the same scene, art-directed with `<picture>`. The wide one (`meadow-wide`, 2752px) is Higgsfield's outpaint of the 1672px original, zoomed out 1.35× on the same 16:9: the first version put her crown 6% from the top, under the clear header (and a paper plate the header then needed sat on her hairline). It now leaves sky above her head (19% down) and the shoes whole (88%). It shows from 1024px at `50% 50%`, and under 1024px on any screen at least 4:5 wide, where the tall frame would be cut down to its foot and lose her head; there it is set at `72% 50%` to keep her head and the shoes. The tall one (`meadow-tall`, a 4K upscale of the 1122px original) shows on upright phones and tablets, a sliver off each side in the 3:4 box. Her head clears the header at every shape measured (360×560 to 2560×1300) except the flattest landscape phones, where her crown sits about 15px into the header band, clear of its words. Its pale sky and quilt meet the film's satin at the slide edge. The bottom-left is clover, grass and white quilt, where neither paper (1.0–1.3:1) nor ink holds, so the caption sits in the sky, in ink: 45% up from 1024px; on upright phones and tablets 52% up the picture (measured from the image, not the slide, since a short screen trims its top), at most 48% wide to stay clear of her hair; in the wide frame under 1024px, top-left under the header. "Petals Heels" / "Rich Brown, out on the clover." / SHOP PETALS HEELS. Measured 8.9:1 or more from 360 to 2560px wide, short and landscape screens included.
   - **Film slide**: stock footage (Mixkit 51002, pale blue satin: the painted sky's colour), marked `stock footage`. Only its first 4.4s are used, forward then back as one seamless 8.7s loop: later in the clip a darker fabric crosses the caption corner. Muted, `playsinline`, `preload="none"`, poster = its first frame; it plays only while its slide shows and the campaign is on screen, from the start each time. A 16:9 file from 1024px, a 3:4 file cut from the frame's left edge below (1.4MB and 0.9MB). Caption in ink: "Satin and organza" / "Pointed satin slingbacks with a layered organza flower at the toe." / SHOP NOW, to the product. Over every frame and width (360–2560px) ink type holds 4.6:1 or more (the clear header's too); the controls are on their paper ground.
4. **Strip**: four 4:5 tiles, 4px seams: a packshot per colour and "All three" (to the set row). The packshots are AI concept visuals supplied for this preview (1122px, `packshot-*`), each tile marked `AI visual`: one warm ivory sweep, the same three-quarter angle, light from the left, so the row reads as one set. Close impressions of Petals Heels, not exact: the real Rich Brown insole is dark brown, the real straps are lined in black, the flowers run a little large. They stand in until Whimy's own packshots arrive (`PRODUCT-PHOTOGRAPHY.md`); a colour without one falls back to its card photograph. Name, colour and price under each on lines of their own (unlike the reference), headed by a visually hidden h2. Phones: swipe, ~2.4 in view.
5. **Doors**: the two giant-heel crops (`choco-giant`, `kiwi-giant`: brown-led and green-led, and not the strip's photographs), 4:5, edge to edge; only "Shop choco" / "Shop kiwi", sticky to the screen's foot until the photograph ends. A sticky link crosses shoe, skin, fur and floor as the page scrolls, so it sits on its own paper ground (Jimmy Choo's 80% white boxes, made solid).
6. **Letter**: the 50/50 showcase holding the "Dear Whimy Babes" card (Fell Roman, `tbc` wording) beside the black-and-white still life, which fills its half when the letter runs taller (tablets); "Read the letter" sticky on paper, as on the doors.
7. **Scene**: Jimmy Choo's full-bleed banner, with nothing laid on it: the Petronas Twin Towers from below against a pale sky, palm fronds above (Neil Daftary, Unsplash License, marked `stock photo` and credited on `/credits`). Whimy's own KL launch visual (patches over a busy street) stays on A, cropped to its patches. Chosen for its soft daylight and powder-blue sky, the campaign's air, and graded lightly to meet it (saturation ×0.88, green and blue −2%: its sky measured 155,198,231 against the meadow's 159,192,220). 16:9 from 768px at `55% 35%`; 4:3 on phones, the widest crop that keeps both spires whole. Its words follow below in ink: "Based in Kuala Lumpur" / "Something Pointe & Pretty is walking into this city." / OUR STORY.
8. **Services**: "Before you buy": Size & fit · Delivery · Exchanges · Satin & organza care · Questions · Message us; hover grows a 1.5px line from the centre.
9. **Footer**: pale band; the Petals list (underline field, Sign up) with the social glyphs on the left, Help · Shop · Whimy · Small print on the right; market, concept links, legal, payments.

The two concepts differ in composition (split slides and doors vs full-bleed campaign and seams), type treatment (caps titles and box buttons vs 18/14px captions and underlined links), colour (rose band vs none), header behaviour (solid vs clear and hiding) and rhythm (bands and inset panels vs 4px seams). They share data, components and every page after the homepage.

---

## 6. Imagery

- **Sources**: `public/images/whimy/` (WebP, sizes from `scripts/process-images.mjs`), registered in `src/data/assets.ts` with alt text, Instagram credit and dominant colour.
- **Upscaled photographs**: Whimy's Instagram files are 640–1056px wide, soft full-bleed and on retina screens. Six (brown-scale-play, green-scale-play, brown-sky-legs, pink-reveal, group-three-colours, pairs-grid) are served from 4K upscales (Higgsfield, `assets-src/upscaled/`), checked side by side against the originals: faithful, though the Rich Brown flower's petal edges gain a little shimmer and the pairs grid's satin gains fine stitching. `npm run images:upscaled` writes 480/960/1440/1920px WebP and records `upscaledFrom` (the original's size), which the credits page states. They are stopgaps: Whimy's camera originals should replace them. The letter still life stays at its Instagram size on purpose: its upscale rewrote the words of Whimy's printed letter ("Dear Whimy Rares"), so it was rejected. The KL visual is already 2176px.
- **Stock photographs**: `public/images/stock/` and their own manifest (`scripts/stock-images.mjs`, from the downloaded originals in `assets-src/stock/`, each with a light grade in the script); `origin: 'stock'`, alt text ending "(stock photograph)", marked `stock photo` where they show.
- **Concept visuals**: `public/images/concept/` and their own manifest (`scripts/concept-images.mjs`, from `assets-src/concept/`), apart from Whimy's files; `origin: 'concept'`, always `aiGenerated`, alt text opening "AI concept visual". WebP up to 3200px for the full-bleed campaign.
- **Crops**: `scripts/derive-crops.mjs` (`npm run crops`) cuts `choco-grass`, `strawberry-grass`, `kiwi-grass` (all from the one group photograph: one light, one ground for product tiles; each holds one colour), `strawberry-sky`, `choco-giant` and `kiwi-giant` (closer on the shoe; up to 2560px, since they fill B's half-width doors), from the upscaled master where there is one. Boxes are in the original's pixels, so they hold whichever source is used; a crop is never enlarged.
- **Resolution**: `Img` caps a photo at source ÷ 1.25 unless `fill` is set; `fill` is used only where a layout must run edge to edge (heroes, doors, tiles). The upscaled six cap at 1536px, the giant crops at 1988 and 2048px. `Img wide={...}` adds an art-directed `<picture>` source for wide screens.
- **Crops per placement**: `Img position="x% y%"` sets the crop for that layout so the shoe is never cut (the first A slide is `50% 100%`, which brings the giant heel into frame). `position` takes `var()`, so a crop can change by breakpoint (A's tablet slides).
- **Type on photographs** only where measured against the pixels under each line, at every width: ink on sky and studio wall, ink over B's pale satin film, paper with Jimmy Choo's 25% shadow on B's grass and trousers, 24px paper capitals on A's editorial pair. Where no single colour holds (sticky links that travel over a photograph, the KL street), the type gets its own ground or moves off the photograph.
- **Carousel slides** load eagerly (`eager`), so a slide never arrives blank; so do A's doors, whose tops show in the first screen.
- **Film**: `public/video/` holds B's campaign film; `scripts/encode-film.mjs` rebuilds it from the Mixkit download (needs ffmpeg).

## 7. Honesty system (unchanged)

`Provenance` on every value: `verified` (no mark), `assumption` → `tbc`, `mock` → `sample`. One `ProvenanceMark` component; the legend lives in About this preview, which also lists the two concepts. No invented reviews, press, scarcity or was-prices.

## 8. Shared pages

- **Collection**: centred caps title and Whimy's line; one filter bar (Colour, Size, Heel height, sort, count, active filters, clear all); a tiled wall of ivory cards with 4px seams, one card per colour, three-up when there are three. Removing a filter keeps keyboard focus in the bar (the next filter, or the count). Heel bands are named without centimetres, since the Petals height is still `tbc`.
- **Product**: stacked gallery (the colour's lead, its own frames, the group photograph, the still life) beside a sticky buy box; fabric-cut swatches; size squares with sold-out states; the button echoes the size ("Add to bag · EU 37", after Jimmy Choo); the set row (`#all-three`) is where "all three" links land. A colour change cross-fades (a 200ms view transition, skipped in a background tab); a click that lands during the fade is replayed when it ends.
- **Checkout**: each step is a form, so Enter continues (Review is not one, so Enter on its checkboxes never places the order); required fields say so (`aria-required`); every error link lands on a control; below 1024px the error summary and fields scroll clear of the sticky header and order bar. A step left half-edited, or restored from a reload with details that no longer pass, reopens rather than reading "completed". Place order keeps focus while it works (`aria-disabled`).
- **Lines with "·"**: product cards, search, the bag and the footer's payment methods carry each "·" in a lead the line's clip hides at a line's start, so no line opens or closes on a dot.
- **Menu**: one drawer from the left on every width (both references keep categories in a drawer), ending with the Homepage A/B switch.

## 9. Removal list (enforced by `scripts/check-css.mjs` or review)

- No `@keyframes`, `backdrop-filter`, gradients, dashed lines, or shadows other than the photo focus keyline (guard).
- No decorative eyebrows, arbitrary underlines, arrows on buttons, emoji, badges, pills, glows or floating shapes (review).
- No colour-swap or spotlight interaction on product photographs, in any form (client decision).
- No copy written for Whimy: lines are Whimy's own (quoted from its posts) or factual.

## 10. Anti-generic checklist (before every review)

1. Could this page belong to any shoe brand? If so, bring back Whimy's photographs, nicknames or lines.
2. Is each module traceable to its reference (§2), and is its translation justified by Whimy's assets?
3. Does any text sit on a photograph without a measured contrast?
4. Does any crop cut the shoe, the flower or the heel?
5. Are A and B still clearly different at a glance?
6. Does every control do something, on touch and keyboard?
7. Has the mobile layout been recomposed, not just stacked?

## 11. Open inputs and risks

- Original photo files at 2400px+ (six photographs are AI upscales for now; the letter still life is still at its Instagram size).
- A campaign photograph of Whimy's own for B's still slide (an AI concept visual stands in, marked as such).
- Packshots per colour on one ground (both references rely on them for tiles and galleries).
- A film of Whimy's own for B's campaign (stock satin footage stands in, labelled as such).
- Price, sizes, heel height, delivery fees, exchange policy, SSM details, launch date (all marked).
