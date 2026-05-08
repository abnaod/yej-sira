# public/

Static image assets served by the Hono API at `http://localhost:3001/static/*`.

Anything you drop in this folder is reachable at the same relative path, e.g.
`public/categories/pottery.jpg` is served at `/static/categories/pottery.jpg`.

## Convention

| Folder                  | Naming                                  | Used by                                               |
| ----------------------- | --------------------------------------- | ----------------------------------------------------- |
| `categories/`           | `<category-slug>.jpg`                   | `Category.imageUrl` (seeded from `libs/db/prisma/seed.ts`) |
| `listings/`             | `<listing-slug>-<n>.jpg` (n = 1..N)     | `Listing.images[*].url`                               |
| `shops/`                | `<shop-slug>.jpg`, `banner-placeholder.jpg` | Shop logo / default banner when `bannerImageUrl` is null |
| `promotions/`           | `<promotion-slug>.jpg`                  | `Promotion.heroImageUrl`                              |
| `storefront/`           | `hero-seller.jpg`, `hero-fallback.jpg`  | Storefront hero section fallbacks                     |
| `uploads/<folder>/`     | `<uuid>.<ext>` (written by API)         | Seller-uploaded logos/listing images (via `POST /api/uploads`) |

## Expected files (seed data)

The seed script in `libs/db/prisma/seed.ts` references these paths. Drop a file
matching each path before running `pnpm db:seed` (or the page will show a broken
image):

**Categories** — `public/categories/`

- `crochet.jpg`, `jewelry.jpg`, `basketry.jpg`, `pottery.jpg`, `clothing.jpg`, `art-collectibles.jpg`

**Listings** — `public/listings/`

- `hand-glazed-stoneware-mug-1.jpg`, `hand-glazed-stoneware-mug-2.jpg`
- `block-print-linen-pillow-cover-1.jpg`
- `hammered-sterling-silver-earrings-1.jpg`
- `olive-wood-serving-board-1.jpg`
- `botanical-embroidery-hoop-art-1.jpg`
- `original-watercolor-mini-1.jpg`
- `handwoven-cotton-market-tote-1.jpg`
- `soy-wax-candle-trio-gift-set-1.jpg`
- `hand-carved-wooden-coffee-scoop-1.jpg`
- `natural-beeswax-taper-pair-1.jpg`
- `woven-grass-storage-basket-1.jpg`
- `screen-printed-cotton-tea-towel-1.jpg`
- `macrame-wall-hanging-1.jpg`
- `ceramic-speckled-vase-1.jpg`
- `woven-rattan-basket-set-1.jpg`
- `hand-poured-soy-candle-1.jpg`
- `airpods-max-1.jpg`, `airpods-max-2.jpg`, `airpods-max-3.jpg`, `airpods-max-4.jpg`, `airpods-max-5.jpg`
- `placeholder.jpg` (shown when a listing has no images)

**Shops** — `public/shops/`

- `yej-sira.jpg`
- `banner-placeholder.jpg` (default wide banner; Unsplash, gift/shopping—replace with your own if needed)

**Promotions** — `public/promotions/`

- `spring-home-edit.jpg`, `winter-sale-2024.jpg`

**Storefront** — `public/storefront/`

- `hero-seller.jpg`, `hero-fallback.jpg`

## How it works

- The API mounts `serveStatic` from `@hono/node-server/serve-static` at
  `/static/*` in `apps/api/src/index.ts` with this folder as the root.
- URLs in the DB are stored **relative** (e.g. `/static/categories/pottery.jpg`).
- The web app resolves them via `assetUrl()` in `apps/web/src/lib/api.ts`, which
  prefixes `VITE_API_URL`.
- Absolute URLs (`http://…`, `https://…`) pass through `assetUrl()` unchanged,
  so external CDN images still work if sellers use them.
