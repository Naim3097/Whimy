# Whimy storefront

A frontend-only storefront for **Whimy**, a Kuala Lumpur heels label ("the heels of that girl next door"), built to show the client how their first collection, Petals Heels, could sell online. It has **two homepage concepts** over one shared shop: collection, product pages, search, bag, saved pairs, a four-step checkout, order confirmation, Help, Story and Next bloom.

| Route | Concept |
|---|---|
| `/` | **Concept B** (the default), after [jimmychoo.com](https://www.jimmychoo.com/en/home?geoip=geoip) |
| `/concept-a` | **Concept A**, after [christyng.com](https://www.christyng.com/) |

Paths never name the reference sites. B's old path, `/home-jimmy-choo`, redirects to `/` so links already shared still land. A first visit wears B's chrome on every shop page; the concept last visited is remembered after that.

There is no backend. Orders, saved pairs and newsletter sign-ups live in the browser; no payment is taken and no email is sent. The storefront explains this in the **About this preview** dialog (footer, Small print) and on the checkout and confirmation pages.

The brand facts come from `Whimy-Research-Report.md`, the source of truth. The visual direction, including what was measured on both reference sites, is in [`DESIGN.md`](./DESIGN.md).

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit, component and route tests (Vitest)
npm run typecheck  # TypeScript project check
npm run lint       # oxlint + the CSS guard (scripts/check-css.mjs)
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
```

**Requirements:** Node 20 or newer (built with Node 24). `.env.example` lists the optional variables.

**OneDrive notes.** This folder sits in OneDrive:
- Its directories are reparse points that Vite's native resolver cannot canonicalise, so `vite.config.ts` and `vitest.config.ts` set `resolve.preserveSymlinks: true`.
- Its sync layer drops some file-change events, so the dev server watches by polling (`server.watch.usePolling`). Without it, edits sometimes never reach the browser.
- `node_modules` is large; consider excluding it from sync.

---

## The two concepts

- Each homepage follows its reference's composition, type treatment, calls to action, header behaviour and rhythm (DESIGN.md §2, §4, §5), filled with Whimy's own photographs, lines and colours.
- **Shared state**: the bag, Saved, orders and the launch stage live in providers above the router (`AppProviders` in `src/App.tsx`), so moving between concepts never resets them.
- **Shared pages, concept chrome**: the concept last visited (`ui.concept`, remembered in storage) dresses the bar, header and footer of every other page, and the wordmark leads back to that concept's homepage. `useActiveConcept()` (`src/hooks/useConcept.ts`) reads it, with the homepage's own path taking precedence so a homepage never flashes the other chrome.
- **Switching for a presentation**: a small "Homepage A | B" control sits at the end of the bar above the header on both homepages (768px and wider), at the end of the menu drawer, and in the footer. About this preview names both concepts.

To add or change a concept, edit `src/config/concepts.ts` and the route in `src/routes.tsx`.

---

## What's real and what's sample

Every value carries a `Provenance` in `src/domain/types.ts`: `verified`, `assumption` or `mock`. One component (`ProvenanceMark`) turns these into two small marks: **tbc** for a fact Whimy hasn't published, **sample** for a demo value. Verified facts carry no mark.

| Area | Status | Where |
|---|---|---|
| **Petals Heels** in Rich Brown (*choco*), Blush Pink (*strawberry*), Sage Green (*kiwi*); upper, toe, fastening, flower, footbed | Verified | `src/data/mock/products.ts` |
| The colour lines on A's slides ("the main character (so far).", "every girl needs a hint of pink in her wardrobe.", "the third bloom."), "Brown lover / Pink lover" (Whimy's TikTok question), "petals, satin, pointe.", "Something Pointe & Pretty is walking into this city." | Whimy's own words | `src/pages/HomeA.tsx`, `src/pages/HomeB.tsx`, `src/data/content.ts` |
| The "Dear Whimy Babes" letter, transcribed from the 22 Oct photograph | Wording to be confirmed | **tbc** · `src/data/content.ts` |
| Whimy's imagery: 7 photographs, 4 graphics, brand-mark crops and 6 art-directed crops (`npm run crops`) | Whimy's | `public/images/whimy`, `src/data/assets.ts`, credited on `/credits` |
| Six of those photographs (and their crops) served from AI upscales of the Instagram files | Whimy's, upscaled for this preview | `assets-src/upscaled`, stated per image on `/credits` |
| The meadow visual on Concept B's first campaign slide (a model in Rich Brown slingbacks on a clover meadow) | AI concept visual made for this preview, not Whimy's photograph; its heels are an impression of Petals Heels | **AI visual** · `public/images/concept`, credited on `/credits` |
| The packshots in Concept B's strip (one per colour and all three) | AI concept visuals made for this preview, close impressions of Petals Heels, not product photographs | **AI visual** on each tile · `public/images/concept` (`packshot-*`), credited on `/credits` |
| The Petronas Towers photograph in Concept B's Kuala Lumpur scene | Stock photograph (Neil Daftary, Unsplash License), not Whimy's; lightly graded | **stock photo** · `public/images/stock`, credited on `/credits` |
| The satin film in Concept B's campaign | Stock footage (Mixkit), not Whimy's | **stock footage** · `public/video`, credited on `/credits` |
| Price (RM 199.00), the PETALS3 set price, delivery rates, promo codes, payment methods, exchange window | Sample | **sample** |
| Size range EU 35–40, heel height, lining/outsole, fit, care, box, registered name, SSM no., address, contact | Not published | **tbc** |
| 4 **sample styles** (stock photographs) | Demo only, not Whimy products | **sample** · only on `/preview/catalogue` |

**Launch stage.** `site.launchStage` (`src/config/site.ts`) is `preview-live` (Add to bag, sample price) or `waitlist` (Join the Petals list, "Price to be announced"). About this preview switches it on this device.

---

## Design system

**[`DESIGN.md`](./DESIGN.md)** is the source of truth.

- **Fonts** (self-hosted via Fontsource, imported and preloaded in `src/main.tsx`): **Libre Franklin** (variable) is the working face; **IM Fell English** (italic and Roman) is Whimy's voice and wordmark; **IM Fell English SC** for rare labels.
- **Tokens** (`src/styles/tokens.css`): colour (paper, ivory, champagne, ink, Rich Brown action, the swatches, the two concept bands), type scales (`--t-*`, the Fell `--v-*`, `--a-*` for A, `--b-*` for B), spacing, grid per breakpoint, motion, layers.
- **Shared vocabulary** (`src/styles/components.css`): type classes, `.btn`, `.btn-box` (A's white box), `.cta-line` (B's underlined capitals), `.link`, layout, forms, accordion, dialogs and drawers.
- **The CSS guard** (`scripts/check-css.mjs`, part of `npm run lint`) fails on `@keyframes`, `backdrop-filter`, gradients, dashed lines and any `box-shadow` other than the photo focus keyline.
- **Breakpoints:** 768 / 1024 / 1280px, written literally in media queries.

---

## Routes

| Path | Page |
|---|---|
| `/` | Concept B homepage (the default) |
| `/concept-a` | Concept A homepage |
| `/home-jimmy-choo` | redirects to `/` (B's old path) |
| `/shop` | redirects to `/shop/petals-collection` |
| `/shop/:slug` | Collection: title, filter bar, sort, tiled grid (one card per colour) |
| `/products/:slug?colour=rich-brown\|blush-pink\|sage-green` | Product page (`#all-three` scrolls to the set row) |
| `/search` | Search (Whimy products only) |
| `/bag` | Bag (`/cart` redirects) |
| `/saved` | Saved pairs (`/wishlist` redirects) |
| `/checkout` | Four-step checkout with its own quiet header and footer |
| `/order/:reference` | Order confirmation |
| `/account` | Orders, saved pairs and details kept on this device |
| `/story` | The letter, the lookbook, the first ten days (`/about` redirects) |
| `/help` | `#size-fit`, `#delivery`, `#exchanges`, `#care`, `#faq`, `#contact` (`/size-guide`, `/shipping`, `/returns`, `/faq`, `/contact` redirect) |
| `/next-bloom` | Which colour should bloom next? Vote and join the list |
| `/privacy`, `/terms`, `/credits` | Privacy notice (EN / BM), Terms, Image credits |
| `/preview/catalogue` (+ `/:slug`) | Sample styles beside Petals, with filters (noindex) |
| `*` | Page not found |

Routes are defined in `src/routes.tsx` (shared by the browser router and the route tests). Secondary routes and Concept B are code-split.

---

## Project structure

```
src/
  App.tsx                  AppProviders (UI, catalogue, Saved, bag) + the browser router
  routes.tsx               The route table
  config/                  site.ts (brand and business info, launch stage), concepts.ts (A and B)
  domain/types.ts          Domain model (Product, Colourway, ImageSource, CartLine, Order, …)
  data/
    assets.ts              Image registry: Whimy's files, the derived crops, the sample images
    whimy-image-manifest.json  Generated by scripts/process-images.mjs and scripts/derive-crops.mjs
    content.ts             Verified copy: the letter, the post timeline, Next bloom options, Help anchors
    mock/                  Products, collections, commerce rules
  services/                Data-access interfaces and their mock implementations
  lib/                     Pure logic: catalogue, cart, checkout, launch stage, money, validation, storage
  state/                   React providers: catalogue, cart, wishlist, UI (toasts, dialogs, launch stage, concept)
  hooks/                   useResource, useCarousel, useConcept, media queries, page meta, recently viewed
  styles/                  tokens.css, base.css, components.css
  components/
    layout/                ConceptBar, Header, Footer (both skins), ConceptSwitch, menu drawer, search, About this preview
    product/ cart/ checkout/ help/ ui/ brand/ home/(NextBloom)
  pages/                   HomeA, HomeB, CollectionPage, ProductPage, … (route components)
scripts/
  process-images.mjs       Source photos → responsive WebP + manifest
  derive-crops.mjs         Art-directed crops of the processed photos → manifest
  check-css.mjs            The CSS guard
```

---

## Backend integration

UI code never imports mock data directly for commerce operations. It goes through `services` (`src/services/types.ts`):

| Interface | Methods | Replace with |
|---|---|---|
| `CatalogService` | `listProducts`, `getProduct`, `listCollections`, `getCollection`, `search`, `getRecommendations` | Commerce API / headless CMS |
| `OrderService` | `submitOrder` (idempotent on `idempotencyKey`), `getOrder`, `listOrders` | Order API + payment gateway redirect |
| `NewsletterService` | `subscribe` | ESP with PDPA consent stored |
| `ContactService` | `send` | Helpdesk / email |

1. Implement `Services` in `src/services/<provider>/index.ts`; map responses onto the domain types; keep amounts in **sen**.
2. Select it in `src/services/index.ts` (e.g. `VITE_DATA_SOURCE=api`, `VITE_API_URL`).
3. **Bag, Saved and the concept** persist through `StorageAdapter` (`src/lib/storage.ts`); swap in a server-synced adapter or sync on login.
4. **Inventory:** product pages and the bag read `colourway.stock`; `submitOrder` re-validates stock.
5. **Payments:** checkout collects a `PaymentSelection` only and never takes card numbers. Shopify Payments is not available in Malaysia; consider Billplz, iPay88, toyyibPay, senangPay or Stripe MY.
6. **Auth:** `/account` has no sign-in by design until a provider is chosen.
7. **Before launch**, fill in the legal disclosures in `src/config/site.ts` (registered name, SSM number, address, contact) and confirm the Bahasa Malaysia privacy notice (CPETTR 2024, PDPA).

---

## Assets

- **Whimy's imagery** belongs to Whimy (showing it to the client is fine; anything public needs their permission and ideally the original files).
  1. Put source JPEGs in a folder and run `npm run images -- <folder>`.
  2. Run `npm run crops` to re-cut the derived crops from the new files.
  3. Point entries in `src/data/assets.ts` at the keys.
- **Upscaled masters** (`assets-src/upscaled/<key>.png`, Higgsfield 4K upscales) replace a key's files: `npm run images:upscaled`, then `npm run crops` (crops cut from a master when there is one). Delete a master to go back; when Whimy's camera originals arrive, run step 1 and remove the masters.
- **Concept visuals** (`assets-src/concept/<key>.png`, upscaled masters of AI visuals made for this preview) build to `public/images/concept` and their own manifest with `node scripts/concept-images.mjs`; register them in `conceptImages` in `src/data/assets.ts`.
- **Stock photographs** (`assets-src/stock/<key>.jpg`, the licensed originals) build to `public/images/stock` and their own manifest with `node scripts/stock-images.mjs`, which applies each one's grade; register them in `stockImages` in `src/data/assets.ts`.
- **The campaign film** (`public/video/`) is rebuilt from the Mixkit download with `node scripts/encode-film.mjs <51002-1080.mp4>` (needs ffmpeg): a 16:9 and a 3:4 loop, and the poster.
- **`Img`** (`src/components/ui/Img.tsx`) paints the dominant colour while loading, retries once, and falls back to a labelled frame. It caps a photo at source ÷ 1.25 unless `fill` is set (edge-to-edge layouts only). `position` sets the crop per placement. `eager` loads carousel slides waiting off-screen. `wide` adds an art-directed `<picture>` source (B's campaign: a 16:9 frame from 1024px, 4:5 below).
- **Sample images** are hotlinked Unsplash photographs, shown only under `/preview/catalogue`, credited on `/credits`.

---

## Accessibility

Targets WCAG 2.2 AA: semantic landmarks and a skip link; visible focus everywhere (a paper keyline inside photos); native `<dialog>` and `<details>`; radios for colour and size (arrow keys; sold-out sizes disabled and announced); labelled forms with linked inline errors and a focused error summary; live regions for status. A's slideshow and B's campaign follow the WAI-ARIA carousel pattern: they hold while focus is anywhere inside them (A's also under the pointer) until Play is pressed, put Pause/Play first, announce slide changes only once they stop turning on their own, swipe on touch screens, and never move on their own under `prefers-reduced-motion` (Play starts them). B's utility bar holds on hover or focus, offers Next and a keyboard-only Stop/Resume, and announces the message Next brings in. Touch targets are at least 44 × 44px (invisible hit areas where the drawn control is smaller), except in the thin top bars, whose targets are as tall as the bar allows (WCAG 2.2 AA asks 24px): the Homepage A|B squares at 44 × 36px in A's bar, and every link and button in B's 26px bar (Jimmy Choo's height) at 25–26px. B's one Pause also stops its film, which has no sound. Slides that are not showing are `inert`. Type laid on a photograph or the film was measured against the pixels under each line at widths from 360 to 2560px. Where no colour holds, it gets its own ground or moves off the image. B's hiding header comes back when focus enters it.

---

## Testing

- **Automated** (`npm test`): Vitest + Testing Library, including route tests that mount the real route table. `src/pages/concepts.test.tsx` covers both homepages, A's slideshow (dots, Pause, swipe, announcements), B's campaign (arrows, bars, the labelled film, one Pause for slides and film, holding while focus is inside), B's utility bar, focus after removing a filter, concept memory across shop pages, and the bag surviving a concept switch. `src/pages/checkout.test.tsx` covers Enter to continue, required fields, where each error link lands, restored and half-edited steps, and Enter never placing the order. Component tests cover the utility bar's announcements, the set dialog's error state and the product page's link names. The rest cover the image registry (sharpness caps, upscale records, the first-photo preload in `index.html` matching the files), price marks, launch-stage copy, the cart reducer, filters and sorting, search, delivery and promo rules, validation, idempotent orders and the colour and size selectors.
- **Lint** (`npm run lint`): oxlint, then the CSS guard.
- **Demo shortcuts** (also in About this preview): promo codes `PETALS3`, `FREESHIP`, `LOVEWHIMY`, `BLOOM20` (`OLDBLOOM` is expired); an email containing `decline` shows a declined payment; About this preview → Reset preview data clears this device.

---

## Open questions for Whimy

Price · sizes and fit · heel height · delivery fees · exchange policy · registered name and SSM no. · launch date · original photo files (six are AI upscales for now) · a campaign photograph of Whimy's own for Concept B (an AI concept visual stands in) · packshots per colour on one ground · a film of Whimy's own for Concept B's campaign (stock footage stands in) · whether the site checks out directly or hands off to TikTok Shop.
