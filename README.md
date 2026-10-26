# Velo

Velo is an independent, road-first showcase of performance bikes. It is not a bike brand or
retailer, and it is not affiliated with the makers whose products appear here. Visitors choose a
maker to see its bikes in a distinct editorial world, with photos, indicative prices, and
specifications where those details are available.

Built with Vite, React, TypeScript, Tailwind CSS, GSAP, Lenis, Wouter, and Sharp.

## Run and build

```sh
npm install
npm run dev
npm run build
```

The production build is written to `dist/`. The browser tab title is exactly `Velo` on every route.
On Vercel, select the **Vite** framework preset, use `npm run build` as the build command, and set
`dist` as the output directory.

## Bike data and integrity

Brands, bikes, the glossary, and site copy live in `src/data/`. The owner's catalogue is
`src/data/model-list.txt`: use one bike per line, grouped under `[brand]` blocks. A `discipline X`
line sets the discipline for following bikes. Add family context with `@Family | category | note`,
then list builds as `family | name | price | key=value; key=value`. Prices may be left blank.
Supported details include `cat`, `groupset`, `wheels`, `frame`, `was`, and `note`.

After editing the list, run the catalog and image steps in this order, then start Vite:

```sh
npm run catalog
npm run images
npm run dev
```

`npm run catalog` updates `src/data/bikes.json`, writes `catalog.map.json` beside the selected image
root, and produces `docs/image-inventory.txt` and `docs/catalog-report.md`. Read both reports after
each run: they record the scanned files, matches, shared family photos, ambiguities, missing images,
low-resolution files, and merge decisions. Unmatched bikes remain in the catalogue but are not
published until they have an eligible photo. The `images` step creates responsive AVIF and WebP
files in `public/bikes/` and updates `src/data/images.generated.json`.

Use the `inherit` field only when builds share a frame. Inheritance may supply geometry, claims, and
Frame or Fork specifications; it does not carry over drivetrain, wheels, brakes, or cockpit details.
Do not invent specifications, prices, weights, dates, claims, or images. Add technical values only
after checking an official maker source, retain the source links, and set a verification date only
when the data has been checked. Basic or partial listings are explicitly identified as such.

Prices are indicative, dated, and linked to the maker. Photos must be permitted for use and credited;
brand names identify products and do not imply partnership. Preserve the independence notice in the
footer and About page.

## Photo folders

Put original, permitted photos under either `assets-src/` or `asset-src/` in the project root. The
catalog selects the available image root; if both exist, it uses the one containing more images.
Brand folders may use any capitalization and may be nested at any depth, for example:

```text
assets-src/Pinarello/
assets-src/SPECIALIZED/
assets-src/factor/
assets-src/Canyon/
assets-src/site/hero.png
```

Keep source filenames unchanged. Bike images are matched using their folder and filename tokens
against `model-list.txt`; ambiguous matches are reported rather than guessed. A site hero may be
named `hero.png`, `hero.jpg`, `hero.jpeg`, `hero.webp`, or `hero.avif` at the image root or in its
`site/` folder. Optional per-brand photo credits and license details belong in
`{brand-folder}/credits.json`.

## Before launch

Replace the example canonical site URL and Open Graph image in `src/data/site.json`. Check source
links, prices, verification dates, photo permissions, credits, and the latest catalog report. Set
`VITE_FORM_ENDPOINT` if the contact form should submit to a service; without it, the form opens an
email draft. Anything prefixed `VITE_` becomes public in the built site, so never put a real secret
in it.
