# Shop Subdomain Storefronts

## Goal

Each active shop gets a generated ecommerce storefront at `{shop.slug}.{baseDomain}`. The main marketplace domain continues to aggregate listings across all shops, while a shop subdomain scopes the entire public buying flow to that shop.

For v1, white-labeling means:

- shop-scoped public browsing and buying
- shop branding from existing public shop fields
- generated subdomains derived from the existing `Shop.slug`

Full theme customization and custom domains are out of scope for v1.

## Host Model

Configure the platform with explicit host settings:

- `MARKETPLACE_HOST`, for example `yejsira.com`
- `SHOP_SUBDOMAIN_BASE_DOMAIN`, for example `yejsira.com`
- reserved subdomains, for example `www`, `api`, `admin`, `seller`, `mail`, `cdn`, `assets`, `staging`, `dev`, `localhost`

The resolver treats the marketplace host and reserved subdomains as non-shop hosts. A generated shop subdomain is valid only when the first hostname label is a DNS-safe shop slug and the base domain matches the configured shop subdomain base domain.

Every active shop automatically gets a generated storefront. Missing, inactive, rejected, or suspended shop subdomains render a branded unavailable page with HTTP 404 when SSR can set the status.

Production storefronts are HTTPS-only. Auth/session and anonymous cart cookies should be scoped to the parent domain in production so customer identity and cart continuity work across the marketplace and generated shop subdomains.

Local development should support `shop-a.localhost:3000` plus a fallback override/query/header path for environments where wildcard localhost behavior is awkward.

## Tenant Resolution

Tenant resolution is centralized in backend middleware/helpers and exposed to public storefront routes as validated tenant context.

The web app detects storefront context from the browser/SSR hostname and sends both:

- `X-Shop-Slug`
- `X-Storefront-Host`

The API is authoritative. It only honors those headers when they match allowed storefront host rules, explicit dev fallback rules, and an active shop. Main-domain marketplace requests should not send tenant headers. Seller and admin APIs ignore storefront tenant context entirely and continue using authenticated ownership/admin authorization.

The React app should also have a global tenant context before public route rendering. It should expose values such as:

- `isShopSubdomain`
- `shopSlug`
- public `shop` summary
- marketplace host/base-domain config

On shop subdomains, the app fetches and validates the active shop once at tenant layout level. The tenant bootstrap endpoint should be a separate lightweight endpoint, such as `/api/storefront/tenant`, and return only public fields needed globally:

- `id`
- `slug`
- `name`
- `description`
- `imageUrl`
- `contactEmail`
- `contactPhone`
- `socialLinks`
- `shippingPolicy`
- `returnsPolicy`

Do not expose owner IDs, tax IDs, legal business details, or moderation details through tenant bootstrap.

## Storefront Scope

On `{shop.slug}.{baseDomain}`, the entire public buying flow is shop-scoped:

- home
- categories
- search
- promotions
- listing detail
- favorites
- cart
- checkout
- payment success/return
- order history/detail

The main marketplace domain remains global and continues to show all shops/listings. Main-domain `/shops/:shopSlug` pages remain valid after subdomains launch.

Marketplace and storefront URLs can both exist for the same resource:

- marketplace shop page: `main.com/{locale}/shops/{shopSlug}`
- marketplace listing page: `main.com/{locale}/listings/{listingId}`
- storefront home: `{shopSlug}.main.com/{locale}`
- storefront listing page: `{shopSlug}.main.com/{locale}/listings/{listingId}`

On a storefront, listing/category/search/review/favorite/cart/order APIs must enforce that referenced resources belong to the current shop. Public cross-tenant resources return 404. Authenticated customer actions targeting another shop's cart/order/favorite resources return 403.

Bare shop subdomains redirect to the default locale route, currently `/en`.

## Catalog Behavior

Existing public catalog endpoints become tenant-aware when validated storefront context is present.

On the marketplace domain, catalog behavior remains global. On a storefront:

- listings are limited to the current shop
- listing detail returns 404 when the listing belongs to another shop
- search is strictly shop-local with no global fallback
- categories reuse the global taxonomy but only show categories with active listings in the current shop
- category counts, filters, facets, and filter options reflect only current-shop listings
- promotions are global platform promotions filtered to the current shop's eligible listings
- featured content uses the existing listing `featured` flag filtered to the current shop
- reviews/ratings are allowed only for current-shop listings

## Cart And Checkout

Customer account/session is shared across the marketplace and storefront subdomains. Anonymous cart tokens are also shared across the parent domain.

Cart behavior is scoped by storefront context:

- storefront cart shows only current-shop items
- other-shop cart items remain untouched and reappear on the marketplace cart
- adding a cart item on a storefront rejects variants outside the current shop
- updating or deleting a cart item on a storefront only allows current-shop cart items

Storefront checkout creates an order containing only current-shop items. It calculates totals from those items only, sets storefront origin metadata, and clears only current-shop cart lines after successful order creation. If the shared cart contains no current-shop items, storefront checkout is blocked as an empty shop cart.

Main-domain checkout can remain mixed-shop for now unless implementation reveals a hard payment or fulfillment limitation.

## Orders And Payments

Use the same `Order` model for marketplace and storefront orders, but add storefront origin metadata such as `originShopId` or `storefrontShopId`.

Order behavior:

- storefront-origin orders are traceable to the shop storefront where checkout began
- subdomain order history shows only orders/items involving the current shop
- main-domain order history remains global
- storefront order detail shows only current-shop items, with displayed totals recalculated for that shop subset where needed

Payment success/return should land back on the same storefront host where checkout began. The API should derive payment return URLs from order origin metadata and configured host settings, not from arbitrary frontend return URLs. Webhooks continue to use a stable backend API URL.

## Frontend Shell

Storefront subdomains use a simplified shop-branded header and shop-specific footer.

Header:

- shop name/logo as the primary brand
- shop-local search/categories/cart/account navigation
- no marketplace-first links that pull users out of the storefront

Footer:

- shop name and existing public contact/policy fields where available
- subtle platform attribution such as `Powered by YEJSIRA`
- marketplace links kept secondary

The storefront home reuses the existing shop page experience for v1. Seller/admin routes do not exist on shop subdomains; they remain on the main domain.

Language switching stays tenant-aware. Switching language on a storefront preserves the same storefront host and changes only the locale path.

Marketplace listing and shop pages should link to the generated storefront URL. Storefront pages should keep marketplace escape links subtle, such as in the footer or account menu, not in product detail body content.

## Slugs And URLs

The generated subdomain is derived directly from `Shop.slug`.

For v1, changing a shop slug changes the generated subdomain. Future slug redirect aliases may be added if SEO or seller sharing needs stable old URLs.

Shop slugs must remain lowercase ASCII DNS-safe:

- `a-z`
- `0-9`
- hyphen
- no leading or trailing hyphen

Slug reservation applies to both shop creation and future slug edits.

For generated subdomains only, frontend code can construct storefront URLs from public config and shop slugs. If custom domains are added later, the API should return canonical storefront URLs because they may no longer be derivable from slug and base domain.

## Seller/Admin UX

Seller onboarding and dashboard UI should show each shop's generated storefront URL. For non-active shops, show the URL but label it unavailable until active.

No separate storefront preview mode is needed for v1 because every active shop subdomain is automatically live.

## SEO

Canonical URLs are context-specific:

- storefront pages canonicalize to their generated subdomain URLs
- marketplace pages canonicalize to main-domain URLs

Do not add generated shop-subdomain sitemap work in v1 unless existing sitemap infrastructure makes it trivial. Pages can still be crawlable with correct canonical tags.

## V1 Non-Goals

- custom domains
- full theme customization
- shop-owned promotions
- generated subdomain sitemaps
- storefront preview mode
- slug redirect aliases
- seller/admin subdomain apps
- automated tests for the first implementation pass

## Implementation Checklist

1. Add backend host config and reserved slug validation.
2. Add centralized storefront tenant resolver and public tenant bootstrap endpoint.
3. Add order storefront origin metadata migration.
4. Make public catalog, category, promotion, listing detail, review, cart, favorites, orders, and checkout endpoints tenant-aware.
5. Update payment initialization to derive return URLs from order origin metadata and host config.
6. Add frontend tenant resolver/context for SSR and browser rendering.
7. Attach `X-Shop-Slug` and `X-Storefront-Host` from storefront API calls.
8. Add shop-branded storefront header/footer and reuse the current shop page for storefront home.
9. Keep seller/admin routes on the main domain and ignore storefront tenant headers there.
10. Add seller/admin UI display of generated storefront URLs.
11. Configure production HTTPS, parent-domain auth/session cookies, parent-domain anonymous cart cookies, CORS, trusted origins, and dev fallback behavior.

## Manual Smoke Checklist

Before calling v1 done, manually verify:

- `shop-a.localhost:3000/en` loads a shop-branded storefront
- invalid shop subdomain shows the branded unavailable page
- storefront search shows only Shop A listings
- storefront category pages and counts show only Shop A listings
- storefront listing detail returns 404 for another shop's listing
- storefront cart shows only Shop A items without deleting other-shop items
- storefront cart mutations reject another shop's variants/items
- storefront checkout creates an order with only Shop A items
- storefront checkout clears only Shop A cart lines
- payment return lands back on the same storefront host
- storefront favorites and order history show only Shop A content
- main domain still shows global marketplace behavior
- seller/admin routes remain available only from the main domain
