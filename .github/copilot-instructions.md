# Velo

Velo is an independent showcase of performance bikes, road first. It is not a bike brand and sells nothing. Visitors pick a maker in the top nav; the whole site re-themes (layout, type, colour, motion, timing) to that maker's world and lists its bikes with photos, prices and technical data. Every bike has a Simple / Full spec switch.

## Integrity (most important)

- Never invent a spec, price, weight, date, claim or image. A value not present in src/data does not exist: hide the row.
- Values from src/data/model-list.txt are the owner's and are shown as supplied. A bike without `verifiedAt` shows the line "Supplied by the site owner, not yet checked against the maker."
- Prices are indicative: currency, `asOf` in a title attribute, link to the maker; decimals only when the amount has them. Hide when null.
- Brand names identify products only. No logos unless public/brands/{slug}/logo.svg from an official media kit. Never imply partnership. Footer and /about carry the independence notice.
- Photos only with permission, credited (default credit: the brand). A bike is published only when it has at least one photo (its own, or a family photo flagged in the report); bikes without photos stay in the data and in docs/catalog-report.md, never as empty pages.
- Never show a raw filename anywhere: titles, slugs, alt text, captions, URLs. Names come from model-list.txt or the identified model.

## Stack

Vite, React 19, TypeScript, Tailwind CSS v4 (CSS-first, tokens in @theme), gsap (ScrollTrigger, SplitText, DrawSVGPlugin: all free), @gsap/react, lenis, wouter. sharp (dev only). Fonts via @fontsource-variable: Bodoni Moda (display) and Hanken Grotesk (text) global; Newsreader (Pinarello), Archivo (Specialized), JetBrains Mono (Factor) lazy per brand. No UI kit, icon pack, animation library, state library or CSS-in-JS.

## Design system

Velo base (light): paper #F6F5F2, ink #0E0E0E, stone-100 #ECEAE5, stone-300 #CFCDC8 (decoration only), stone-600 #5E5C58, gold #B8975A, gold-ink #85652A.
Brand worlds: each entry in src/data/brands.json defines theme (bg, ink, accent, font), motion (ease, duration, stagger, reveal, transition), layout (cinema, split, blueprint, editorial) and groupBy (family | discipline). Apply them ONLY through CSS variables (--bg --ink --accent --font-display, exposed as bg-surface, text-fg, text-accent, font-brand) set by useBrandTheme, and through useBrandMotion + reveal(). Never hard-code a brand's colours, fonts or timings in a shared component. All themes stay LIGHT; palettes are editorial, not official.
Look: semi-flat, minimal, premium restraint. Never: bordered/shadowed card grids, icon circles, stat counters, small uppercase labels, visible gradient fills, glass panels, blobs, emoji. Catalogue tiles are image + text on the page background.

## Links and buttons

- Text links are coloured with --link = color-mix(in oklab, var(--accent) 62%, var(--ink)) (≥ 4.5:1 on the page colour, checked by scripts/contrast.mjs) and are NEVER underlined at rest: no text-decoration, border-bottom or static pseudo-underline anywhere. On hover (hover:hover only) a 1px underline draws left→right and leaves right→left (::after scaleX, 0.4s).
- Top-nav links and the logo have NO underline and no underline animation: hover changes colour only and the current page is shown by colour. No hover/active state may persist after navigation.
- Buttons never use the link underline. <Button/> has: fill-wipe from the pointer side, a dice-roll label (<Dice/>: a real 3D cube of four identical faces, only the front face is exposed to assistive tech, only one label is ever visible, it always rolls upward), a slight magnetic pull, a press scale and a click ripple from the click point. Reduced motion: colour change only.

## Surfaces, texture, edges

- Every element that paints the page colour carries the .paper utility: a static scattered-dot pattern (SVG tile, 1px dots at 10–20% ink) plus two faint vertical guide lines at ≥1024px. Photos never receive the pattern; no fixed overlay may cover photos.
- Edge focus: <EdgeBlur/> adds a progressive blur at the top and bottom of the viewport (3 stacked backdrop-filter layers per edge with elliptical masks, ≤14vh, pointer-events none, under the nav).
- Scrollbar: the native page scrollbar is hidden; the custom <ScrollLine/> is the page scrollbar. Nested scrollers use thin accent scrollbars. No horizontal scrollbar on any page or brand layout (use overflow-x: clip on layout roots, never overflow hidden on text).
- Cursor (fine pointers only): a 4px dot and a 20px hairline ring, no labels, no fills.

## Typography

Display = Bodoni Moda (italic reserved for one accent per heading), text = Hanken Grotesk, tabular numbers in tables and prices. Spec group titles 700, labels 500. Display line-height ≥ 1.04. Headings use text-wrap balance, paragraphs pretty (max 62ch). NEVER cut off text: no fixed heights or overflow hidden/clip on text containers, mask wrappers carry padding for descenders and italics, big headings use <FitText/>, flex/grid children get min-width:0.

## Voice

Editorial, specific, dry, varied rhythm, like a cycling magazine editor. Banned: discover, explore (as a CTA), welcome, learn more, dive in, unlock, elevate, unleash, seamless, cutting-edge, world-class, ultimate, next level, game-changer, passion, journey, crafted; "whether you're…"; "not just X, but Y"; triple adjective lists; more than one em dash per page. Copy lives in src/data/*.json. The browser tab title is exactly "Velo" on every route.

## Data model

src/data/model-list.txt is the owner's list (one bike per line, family notes, disciplines). `npm run catalog` merges it into bikes.json, preserving curated fields. A bike may `inherit` another bike's geometry, claims and its Frame and Fork spec groups (same frame, different build), never Drivetrain, Wheels, Brakes or Cockpit. `base: true` bikes are data-only and never published. Brands group their bikes (groupBy) with tabs; layouts render one group at a time (default: the first), kept in the URL as ?g=.

## Detail switch

Segmented slider "Simple | Full spec" (radiogroup, arrow keys, sliding thumb), stored in localStorage 'velo:detail'. Default Full spec on model pages, Simple elsewhere. Simple = facts + plain-English line from glossary.json. Full spec = facts, specs sorted into canonical parts, geometry, claims, colours, sources. Collapse with CSS grid-rows.

## Images

The images root is the first folder named assets-src or asset-src (case-insensitive) in the project root; brand folders match brands.json slug or name case-insensitively, at any depth. Hero: hero.(png|jpg|jpeg|webp|avif) at the images root or in site/. Matching uses the full relative path (folders + filename) against model-list.txt; every item token must appear in the path; edition tokens (cf, cfr, slx, sl, sworks, slevel, pro, expert, comp, sport, ltd, replica, edition, allroad, tt, hr, sp, f1–f9, x1–x9, e5–e9) must match exactly; the most specific full match wins; ties are reported, never guessed. docs/image-inventory.txt (every file) is written before any matching, and no bike is called missing until its nearest filenames have been checked. `npm run catalog` then `npm run images` (sharp → public/bikes/{brand}/{slug}/{angle}-{640|1280|1920}.{avif,webp}, src/data/images.generated.json, public/site/hero-*). Scan with the terminal, not editor search (the folder is git-ignored). Only <Photo> renders bike images. Angles: side, three-quarter, front, cockpit, drivetrain, fork, lifestyle, detail-N.

## Motion

Only transform, opacity, clip-path (plus the blur layers). Easing, duration and stagger come from the brand's motion config; other UI uses src/lib/motion.ts. Every drop-down, dialog, tray and link animates in and out. Page transitions: a soft, long, two-layer cover in the palette of the brand involved (target brand, else the brand being left, else Velo), theme swapped only when fully covered, then a staggered reveal. Back to top uses scrollToTop(): anticipation dip, fast smooth ascent through the page, small rebound, settle; user input interrupts it. Every bike block, row, tile and spec part has a scroll intro (fade + slide in) and outro via data-section. Lenis runs on every route as one instance (autoRaf false, driven by gsap.ticker, lagSmoothing(0)); nested scrollers and overlays use data-lenis-prevent. Reduced motion: no Lenis, pin, scrub, cursor, overlays or rolls. ScrollTriggers are created in page order inside useGSAP. No page-level CSS scroll-snap. No transform or filter on a page wrapper.

## Code

src/{main.tsx, App.tsx, index.css, routes.ts, types.ts, lib/, hooks/, data/, components/, layouts/, pages/}. Types inferred from JSON. Small single-purpose components (<80 lines), named exports, no `any`, no dead code, no comments that restate code. Pages and layouts lazy-loaded; initial JS ≤ 170 KB gz, each chunk ≤ 30 KB gz. Semantic HTML, 100svh, visible focus, AA contrast, keyboard reachable, aria-live for dynamic results.

## Responsive

Mobile-first, fluid 320 → 2560px. Hover effects only under (hover:hover). Touch targets ≥ 44px. Pinned horizontal scenes only ≥ 768px.

## Working method

Plan in ≤10 lines, then write files in batches. Don't rewrite whole files for small fixes; don't re-read files just written. Run `npm run build` once at the end, fix errors, summarize in ≤8 lines. Do only what the current prompt asks. Never edit src/data/*.json unless the prompt says so; when adding data, copy only values visible on the provided source.
