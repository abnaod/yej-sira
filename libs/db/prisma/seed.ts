import { config } from "dotenv";
import {
  CategoryAttributeInputType,
  ContentLocale,
  Prisma,
  type PrismaClient,
} from "@prisma/client";

config({ path: "../../.env" });

/**
 * Category image paths reference the API's static folder at `<repo>/public/categories/`.
 * Drop a file named `<slug>.jpg` (matches the `slug` below) into that folder.
 */
const categories = [
  {
    slug: "crochet",
    name: "Crochet",
    imageUrl: "/static/categories/crochet.jpg",
    sortOrder: 0,
  },
  {
    slug: "jewelry",
    name: "Jewelry",
    imageUrl: "/static/categories/jewelry.jpg",
    sortOrder: 1,
  },
  {
    slug: "basketry",
    name: "Basketry",
    imageUrl: "/static/categories/basketry.jpg",
    sortOrder: 2,
  },
  {
    slug: "pottery",
    name: "Pottery",
    imageUrl: "/static/categories/pottery.jpg",
    sortOrder: 3,
  },
  {
    slug: "clothing",
    name: "Clothing",
    imageUrl: "/static/categories/clothing.jpg",
    sortOrder: 4,
  },
  {
    slug: "art-collectibles",
    name: "Art & Collectibles",
    imageUrl: "/static/categories/art-collectibles.jpg",
    sortOrder: 5,
  },
] as const;

const tagDefinitions = [
  { slug: "handmade", name: "Handmade" },
  { slug: "new", name: "New" },
  { slug: "gift-ready", name: "Gift ready" },
  { slug: "editors-pick", name: "Editor's pick" },
] as const;

type SeedListing = {
  slug: string;
  categorySlug: (typeof categories)[number]["slug"];
  name: string;
  description: string;
  featured: boolean;
  tagSlugs: (typeof tagDefinitions)[number]["slug"][];
  images: string[];
  variants: {
    sku?: string;
    label: string;
    colorHex?: string;
    price: Prisma.Decimal;
    compareAtPrice?: Prisma.Decimal;
    stock: number;
  }[];
};

const promotionSeeds = [
  {
    slug: "spring-home-edit",
    title: "Spring home edit",
    subtitle: "Curated picks for warmer days",
    badgeLabel: "Spring deal",
    startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    heroImageUrl: "/static/promotions/spring-home-edit.jpg",
    sortOrder: 0,
    priority: 10,
    listingSlugs: [
      "hand-glazed-stoneware-mug",
      "block-print-linen-pillow-cover",
      "olive-wood-serving-board",
    ] as const,
  },
  {
    slug: "winter-sale-2024",
    title: "Winter sale 2024",
    subtitle: "Ended — kept for QA",
    badgeLabel: "Winter sale",
    startsAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    endsAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    heroImageUrl: "/static/promotions/winter-sale-2024.jpg",
    sortOrder: 1,
    priority: 0,
    listingSlugs: ["botanical-embroidery-hoop-art", "original-watercolor-mini"] as const,
  },
] as const;

const SEED_REVIEWER_USERS = [
  { id: "seed-reviewer-1", name: "Alex M.", email: "alex.m@example.test" },
  { id: "seed-reviewer-2", name: "Sam K.", email: "sam.k@example.test" },
  { id: "seed-reviewer-3", name: "Jordan R.", email: "jordan.r@example.test" },
] as const;

const SEED_REVIEW_COMMENTS = [
  "Exceeded expectations — would buy again.",
  "Beautiful quality and fast shipping.",
  "Great value; the listing itself is lovely.",
] as const;

async function recalculateListingRatingAggregate(prisma: PrismaClient, listingId: string) {
  const agg = await prisma.listingRating.aggregate({
    where: { listingId },
    _avg: { stars: true },
    _count: true,
  });
  const avg = agg._avg.stars ?? 0;
  const count = agg._count;
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      rating: new Prisma.Decimal(count === 0 ? "0.00" : avg.toFixed(2)),
      reviewCount: count,
    },
  });
}

const listings: SeedListing[] = [
  {
    slug: "hand-glazed-stoneware-mug",
    categorySlug: "pottery",
    name: "Hand-glazed stoneware mug",
    description: "Wheel-thrown, food-safe glaze · Made in Vermont",
    featured: true,
    tagSlugs: ["handmade", "new"],
    images: [
      "/static/listings/hand-glazed-stoneware-mug-1.jpg",
      "/static/listings/hand-glazed-stoneware-mug-2.jpg",
    ],
    variants: [
      { label: "Celadon", colorHex: "#A8C5BB", price: new Prisma.Decimal("36.00"), stock: 24 },
      { label: "Rust", colorHex: "#B85C38", price: new Prisma.Decimal("36.00"), stock: 12 },
    ],
  },
  {
    slug: "block-print-linen-pillow-cover",
    categorySlug: "clothing",
    name: "Block-print linen pillow cover",
    description: "Natural linen · Hand block printed in small batches",
    featured: true,
    tagSlugs: ["handmade", "gift-ready"],
    images: [
      "/static/listings/block-print-linen-pillow-cover-1.jpg",
    ],
    variants: [
      { label: "Indigo", colorHex: "#4A5D6B", price: new Prisma.Decimal("48.00"), stock: 30 },
    ],
  },
  {
    slug: "hammered-sterling-silver-earrings",
    categorySlug: "jewelry",
    name: "Hammered sterling silver earrings",
    description: "Solid sterling · Each pair slightly unique",
    featured: true,
    tagSlugs: ["handmade", "editors-pick"],
    images: [
      "/static/listings/hammered-sterling-silver-earrings-1.jpg",
    ],
    variants: [
      { label: "Silver", colorHex: "#C0C0C0", price: new Prisma.Decimal("62.00"), stock: 18 },
    ],
  },
  {
    slug: "olive-wood-serving-board",
    categorySlug: "art-collectibles",
    name: "Olive wood serving board",
    description: "Single piece of olive wood, hand oiled",
    featured: true,
    tagSlugs: ["handmade", "gift-ready"],
    images: [
      "/static/listings/olive-wood-serving-board-1.jpg",
    ],
    variants: [
      { label: "Natural", colorHex: "#D4C4B0", price: new Prisma.Decimal("54.00"), stock: 15 },
    ],
  },
  {
    slug: "botanical-embroidery-hoop-art",
    categorySlug: "art-collectibles",
    name: "Botanical embroidery hoop art",
    description: "Cotton floss on linen · 8\" hoop, ready to hang",
    featured: true,
    tagSlugs: ["handmade", "new"],
    images: [
      "/static/listings/botanical-embroidery-hoop-art-1.jpg",
    ],
    variants: [
      {
        label: "Sage hoop",
        colorHex: "#9CAF88",
        price: new Prisma.Decimal("44.00"),
        compareAtPrice: new Prisma.Decimal("52.00"),
        stock: 20,
      },
    ],
  },
  {
    slug: "original-watercolor-mini",
    categorySlug: "art-collectibles",
    name: "Original watercolor mini",
    description: "Signed by the artist · Archival paper",
    featured: true,
    tagSlugs: ["new", "editors-pick"],
    images: [
      "/static/listings/original-watercolor-mini-1.jpg",
    ],
    variants: [
      { label: "One of a kind", price: new Prisma.Decimal("28.00"), stock: 8 },
    ],
  },
  {
    slug: "handwoven-cotton-market-tote",
    categorySlug: "clothing",
    name: "Handwoven cotton market tote",
    description: "Heavyweight cotton · Reinforced straps",
    featured: true,
    tagSlugs: ["handmade"],
    images: [
      "/static/listings/handwoven-cotton-market-tote-1.jpg",
    ],
    variants: [
      { label: "Natural undyed", colorHex: "#E8E4DC", price: new Prisma.Decimal("42.00"), stock: 40 },
    ],
  },
  {
    slug: "soy-wax-candle-trio-gift-set",
    categorySlug: "art-collectibles",
    name: "Soy wax candle trio, gift set",
    description: "Three 4 oz tins · Essential oil blends",
    featured: true,
    tagSlugs: ["gift-ready", "handmade"],
    images: [
      "/static/listings/soy-wax-candle-trio-gift-set-1.jpg",
    ],
    variants: [
      { label: "Lavender trio", price: new Prisma.Decimal("38.00"), stock: 22 },
    ],
  },
  {
    slug: "hand-carved-wooden-coffee-scoop",
    categorySlug: "pottery",
    name: "Hand-carved wooden coffee scoop",
    description: "Olive wood · For your jebena ritual",
    featured: true,
    tagSlugs: ["handmade", "gift-ready"],
    images: [
      "/static/listings/hand-carved-wooden-coffee-scoop-1.jpg",
    ],
    variants: [
      { label: "Olive", colorHex: "#6B5A45", price: new Prisma.Decimal("22.00"), stock: 50 },
    ],
  },
  {
    slug: "natural-beeswax-taper-pair",
    categorySlug: "art-collectibles",
    name: "Natural beeswax taper pair",
    description: "Dipped by hand · Unscented",
    featured: true,
    tagSlugs: ["handmade"],
    images: [
      "/static/listings/natural-beeswax-taper-pair-1.jpg",
    ],
    variants: [
      { label: "Natural", price: new Prisma.Decimal("18.00"), stock: 60 },
    ],
  },
  {
    slug: "woven-grass-storage-basket",
    categorySlug: "basketry",
    name: "Woven grass storage basket",
    description: "Fair trade · Natural dye accents",
    featured: true,
    tagSlugs: ["handmade", "gift-ready"],
    images: [
      "/static/listings/woven-grass-storage-basket-1.jpg",
    ],
    variants: [
      { label: "Natural", price: new Prisma.Decimal("34.00"), stock: 25 },
    ],
  },
  {
    slug: "screen-printed-cotton-tea-towel",
    categorySlug: "clothing",
    name: "Screen-printed cotton tea towel",
    description: "Ethiopian motifs · Machine washable",
    featured: true,
    tagSlugs: ["handmade"],
    images: [
      "/static/listings/screen-printed-cotton-tea-towel-1.jpg",
    ],
    variants: [
      { label: "Ivory", price: new Prisma.Decimal("16.00"), stock: 100 },
    ],
  },
  {
    slug: "macrame-wall-hanging",
    categorySlug: "crochet",
    name: "Macramé wall hanging",
    description: "100% cotton cord · Handwoven to order",
    featured: false,
    tagSlugs: ["handmade", "new"],
    images: [
      "/static/listings/macrame-wall-hanging-1.jpg",
    ],
    variants: [
      { label: "Natural", price: new Prisma.Decimal("78.00"), stock: 10 },
    ],
  },
  {
    slug: "ceramic-speckled-vase",
    categorySlug: "pottery",
    name: "Ceramic speckled vase",
    description: "Hand-thrown stoneware · Matte finish",
    featured: false,
    tagSlugs: ["handmade"],
    images: [
      "/static/listings/ceramic-speckled-vase-1.jpg",
    ],
    variants: [
      { label: "Speckled white", price: new Prisma.Decimal("44.00"), stock: 14 },
    ],
  },
  {
    slug: "woven-rattan-basket-set",
    categorySlug: "basketry",
    name: "Woven rattan basket set",
    description: "Set of 3 · Natural rattan · Fair trade",
    featured: false,
    tagSlugs: ["gift-ready", "handmade"],
    images: [
      "/static/listings/woven-rattan-basket-set-1.jpg",
    ],
    variants: [
      { label: "Natural", price: new Prisma.Decimal("56.00"), stock: 9 },
    ],
  },
  {
    slug: "hand-poured-soy-candle",
    categorySlug: "art-collectibles",
    name: "Hand-poured soy candle",
    description: "Lavender & sage · 50-hour burn time",
    featured: false,
    tagSlugs: ["handmade", "gift-ready"],
    images: [
      "/static/listings/hand-poured-soy-candle-1.jpg",
    ],
    variants: [
      { label: "Lavender & sage", price: new Prisma.Decimal("28.00"), stock: 45 },
    ],
  },
  {
    slug: "airpods-max",
    categorySlug: "jewelry",
    name: "Airpods Max",
    description:
      "A perfect balance of exhilarating high-fidelity audio and the effortless magic of AirPods.",
    featured: false,
    tagSlugs: ["new", "editors-pick"],
    images: [
      "/static/listings/airpods-max-1.jpg",
      "/static/listings/airpods-max-2.jpg",
      "/static/listings/airpods-max-3.jpg",
      "/static/listings/airpods-max-4.jpg",
      "/static/listings/airpods-max-5.jpg",
    ],
    variants: [
      { sku: "APM-RED", label: "Red", colorHex: "#E4605E", price: new Prisma.Decimal("549.00"), stock: 12 },
      {
        sku: "APM-SG",
        label: "Space Gray",
        colorHex: "#4A4E51",
        price: new Prisma.Decimal("549.00"),
        stock: 20,
      },
      {
        sku: "APM-GR",
        label: "Green",
        colorHex: "#8DB48E",
        price: new Prisma.Decimal("549.00"),
        stock: 8,
      },
      {
        sku: "APM-SV",
        label: "Silver",
        colorHex: "#D2D3D5",
        price: new Prisma.Decimal("549.00"),
        stock: 15,
      },
      {
        sku: "APM-SB",
        label: "Sky Blue",
        colorHex: "#6B98B7",
        price: new Prisma.Decimal("549.00"),
        stock: 6,
      },
    ],
  },
];

/**
 * New categories: add rows in `categories`, then extend `seedCategoryAttributeDefinitions`
 * with definitions + option keys; run `pnpm db:seed`.
 */
async function seedCategoryAttributeDefinitions(
  prisma: PrismaClient,
  slugToCategoryId: Record<string, string>,
) {
  type Opt = { key: string; labels: { en: string; am: string } };
  type Def = {
    key: string;
    inputType: CategoryAttributeInputType;
    sortOrder: number;
    isRequired: boolean;
    labels: { en: string; am: string };
    options?: Opt[];
  };

  const byCategory: Array<{ slug: (typeof categories)[number]["slug"]; defs: Def[] }> = [
    {
      slug: "crochet",
      defs: [
        {
          key: "fiber_content",
          inputType: CategoryAttributeInputType.select,
          sortOrder: 0,
          isRequired: false,
          labels: { en: "Fiber content", am: "የስፒ አይነት" },
          options: [
            { key: "cotton", labels: { en: "Cotton", am: "ኮቶን" } },
            { key: "wool", labels: { en: "Wool", am: "ስእድ" } },
            { key: "blend", labels: { en: "Blend", am: "ቅልቅል" } },
          ],
        },
        {
          key: "care_instructions",
          inputType: CategoryAttributeInputType.text,
          sortOrder: 1,
          isRequired: false,
          labels: { en: "Care instructions", am: "የአጠባበቅ መመሪያ" },
        },
      ],
    },
    {
      slug: "jewelry",
      defs: [
        {
          key: "material",
          inputType: CategoryAttributeInputType.select,
          sortOrder: 0,
          isRequired: true,
          labels: { en: "Material", am: "ቁስ" },
          options: [
            { key: "gold", labels: { en: "Gold", am: "ወርቅ" } },
            { key: "silver", labels: { en: "Silver", am: "ብር" } },
            { key: "brass", labels: { en: "Brass", am: "ናስ" } },
          ],
        },
        {
          key: "care_instructions",
          inputType: CategoryAttributeInputType.text,
          sortOrder: 1,
          isRequired: false,
          labels: { en: "Care instructions", am: "የአጠባበቅ መመሪያ" },
        },
      ],
    },
    {
      slug: "basketry",
      defs: [
        {
          key: "material",
          inputType: CategoryAttributeInputType.select,
          sortOrder: 0,
          isRequired: false,
          labels: { en: "Material", am: "ቁስ" },
          options: [
            { key: "grass", labels: { en: "Grass / reed", am: "ሣር / ቀንድ" } },
            { key: "rattan", labels: { en: "Rattan", am: "ራታን" } },
            { key: "bamboo", labels: { en: "Bamboo", am: "ባምቡ" } },
          ],
        },
        {
          key: "dimensions_note",
          inputType: CategoryAttributeInputType.text,
          sortOrder: 1,
          isRequired: false,
          labels: { en: "Dimensions", am: "ልኬቶች" },
        },
      ],
    },
    {
      slug: "pottery",
      defs: [
        {
          key: "finish",
          inputType: CategoryAttributeInputType.select,
          sortOrder: 0,
          isRequired: false,
          labels: { en: "Finish", am: "ማብራሪያ" },
          options: [
            { key: "matte", labels: { en: "Matte", am: "ማት" } },
            { key: "glossy", labels: { en: "Glossy", am: "ያንጸባርቅ" } },
            { key: "unglazed", labels: { en: "Unglazed", am: "ያልተነከረ" } },
          ],
        },
        {
          key: "food_safe_note",
          inputType: CategoryAttributeInputType.text,
          sortOrder: 1,
          isRequired: false,
          labels: { en: "Food safety / use", am: "ለምግብ / አጠቃቀም" },
        },
      ],
    },
    {
      slug: "clothing",
      defs: [
        {
          key: "size_label",
          inputType: CategoryAttributeInputType.select,
          sortOrder: 0,
          isRequired: true,
          labels: { en: "Size", am: "መጠን" },
          options: [
            { key: "xs", labels: { en: "XS", am: "XS" } },
            { key: "s", labels: { en: "S", am: "S" } },
            { key: "m", labels: { en: "M", am: "M" } },
            { key: "l", labels: { en: "L", am: "L" } },
            { key: "xl", labels: { en: "XL", am: "XL" } },
          ],
        },
        {
          key: "fabric",
          inputType: CategoryAttributeInputType.text,
          sortOrder: 1,
          isRequired: false,
          labels: { en: "Fabric", am: "ጨርቅ" },
        },
      ],
    },
    {
      slug: "art-collectibles",
      defs: [
        {
          key: "medium",
          inputType: CategoryAttributeInputType.select,
          sortOrder: 0,
          isRequired: true,
          labels: { en: "Medium", am: "መስመር" },
          options: [
            { key: "paper", labels: { en: "Paper", am: "ወረቀት" } },
            { key: "canvas", labels: { en: "Canvas", am: "ካንቫስ" } },
            { key: "digital", labels: { en: "Digital", am: "ዲጂታል" } },
          ],
        },
      ],
    },
  ];

  for (const { slug, defs } of byCategory) {
    const categoryId = slugToCategoryId[slug];
    if (!categoryId) continue;
    for (const def of defs) {
      await prisma.categoryAttributeDefinition.create({
        data: {
          categoryId,
          key: def.key,
          inputType: def.inputType,
          sortOrder: def.sortOrder,
          isRequired: def.isRequired,
          translations: {
            create: [
              { locale: ContentLocale.en, label: def.labels.en },
              { locale: ContentLocale.am, label: def.labels.am },
            ],
          },
          ...(def.options?.length
            ? {
                allowedValues: {
                  create: def.options.map((o, i) => ({
                    key: o.key,
                    sortOrder: i,
                    translations: {
                      create: [
                        { locale: ContentLocale.en, label: o.labels.en },
                        { locale: ContentLocale.am, label: o.labels.am },
                      ],
                    },
                  })),
                },
              }
            : {}),
        },
      });
    }
  }
}

async function seedSampleListingAttributes(
  prisma: PrismaClient,
  slugToListingId: Record<string, string>,
  slugToCategoryId: Record<string, string>,
) {
  const jewelryId = slugToCategoryId["jewelry"];
  const earringsId = slugToListingId["hammered-sterling-silver-earrings"];
  if (!jewelryId || !earringsId) return;

  const matDef = await prisma.categoryAttributeDefinition.findFirst({
    where: { categoryId: jewelryId, key: "material" },
    include: { allowedValues: true },
  });
  const silver = matDef?.allowedValues.find((v) => v.key === "silver");
  if (matDef && silver) {
    await prisma.listingAttributeValue.create({
      data: {
        listingId: earringsId,
        definitionId: matDef.id,
        allowedValueId: silver.id,
      },
    });
  }

  const careDef = await prisma.categoryAttributeDefinition.findFirst({
    where: { categoryId: jewelryId, key: "care_instructions" },
  });
  if (careDef) {
    await prisma.listingAttributeValue.create({
      data: {
        listingId: earringsId,
        definitionId: careDef.id,
        textValue: "Store in a dry place; polish with a soft cloth.",
      },
    });
  }
}

async function main() {
  const { prisma } = await import("../src/index.js");

  await prisma.$transaction([
    prisma.session.deleteMany({
      where: {
        userId: {
          startsWith: "seed-",
        },
      },
    }),
    prisma.account.deleteMany({
      where: {
        userId: {
          startsWith: "seed-",
        },
      },
    }),
    prisma.favorite.deleteMany({
      where: {
        userId: {
          startsWith: "seed-",
        },
      },
    }),
    prisma.user.deleteMany({
      where: {
        OR: [{ id: { startsWith: "seed-reviewer-" } }, { id: { startsWith: "seed-admin-" } }],
      },
    }),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.pickupLocation.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.promotion.deleteMany(),
    prisma.listingImage.deleteMany(),
    prisma.listingVariant.deleteMany(),
    prisma.listing.deleteMany(),
    prisma.shop.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.category.deleteMany(),
  ]);

  const categoryRows = await prisma.$transaction(
    categories.map((c) =>
      prisma.category.create({
        data: {
          slug: c.slug,
          name: c.name,
          imageUrl: c.imageUrl,
          sortOrder: c.sortOrder,
        },
      }),
    ),
  );

  const slugToCategoryId = Object.fromEntries(categoryRows.map((row) => [row.slug, row.id]));

  await seedCategoryAttributeDefinitions(prisma, slugToCategoryId);

  const platformShop = await prisma.shop.create({
    data: {
      slug: "yej-sira",
      name: "Yej Sira",
      description: "Curated marketplace catalog",
      status: "active",
      ownerUserId: null,
      imageUrl: "/static/shops/yej-sira.jpg",
    },
  });

  await prisma.pickupLocation.createMany({
    data: [
      {
        name: "Yej Sira — Bole",
        line1: "Bole Road, near Edna Mall",
        line2: null,
        city: "Addis Ababa",
        postalCode: "1000",
        country: "Ethiopia",
        latitude: new Prisma.Decimal("8.9779"),
        longitude: new Prisma.Decimal("38.7997"),
        sortOrder: 0,
      },
      {
        name: "Yej Sira — Merkato",
        line1: "Merkato, Megenagna area",
        line2: null,
        city: "Addis Ababa",
        postalCode: "1001",
        country: "Ethiopia",
        latitude: new Prisma.Decimal("9.032"),
        longitude: new Prisma.Decimal("38.7469"),
        sortOrder: 1,
      },
      {
        name: "Yej Sira — Hawassa",
        line1: "Tabor Subcity, main road",
        line2: null,
        city: "Hawassa",
        postalCode: "1920",
        country: "Ethiopia",
        latitude: new Prisma.Decimal("7.062"),
        longitude: new Prisma.Decimal("38.4773"),
        sortOrder: 2,
      },
      {
        name: "Yej Sira — Bahir Dar",
        line1: "Kebele 03, near Lake Tana",
        line2: null,
        city: "Bahir Dar",
        postalCode: "6000",
        country: "Ethiopia",
        latitude: new Prisma.Decimal("11.5926"),
        longitude: new Prisma.Decimal("37.3879"),
        sortOrder: 3,
      },
    ],
  });

  await prisma.tag.createMany({
    data: tagDefinitions.map((t) => ({ slug: t.slug, name: t.name })),
  });

  for (const p of listings) {
    const categoryId = slugToCategoryId[p.categorySlug];
    if (!categoryId) throw new Error(`Missing category ${p.categorySlug}`);

    await prisma.listing.create({
      data: {
        slug: p.slug,
        shopId: platformShop.id,
        categoryId,
        name: p.name,
        description: p.description,
        rating: new Prisma.Decimal("0"),
        reviewCount: 0,
        featured: p.featured,
        isPublished: true,
        images: {
          create: p.images.map((url, i) => ({
            url,
            sortOrder: i,
          })),
        },
        variants: {
          create: p.variants.map((v, i) => ({
            sku: v.sku ?? `${p.slug}-v${i}`,
            label: v.label,
            colorHex: v.colorHex,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stock: v.stock,
          })),
        },
        listingTags: {
          create: p.tagSlugs.map((slug) => ({
            tag: { connect: { slug } },
          })),
        },
      },
    });
  }

  const slugToListingId: Record<string, string> = {};
  for (const p of listings) {
    const row = await prisma.listing.findUnique({
      where: { slug: p.slug },
      select: { id: true },
    });
    if (row) slugToListingId[p.slug] = row.id;
  }

  await seedSampleListingAttributes(prisma, slugToListingId, slugToCategoryId);

  const now = new Date();
  await prisma.user.createMany({
    data: SEED_REVIEWER_USERS.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })),
  });

  await prisma.user.create({
    data: {
      id: "seed-admin-1",
      name: "Seed Admin",
      email: "admin@yej-sira.test",
      emailVerified: true,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    },
  });

  for (let pi = 0; pi < listings.length; pi++) {
    const p = listings[pi];
    const listingId = slugToListingId[p.slug];
    if (!listingId) continue;
    for (let ui = 0; ui < SEED_REVIEWER_USERS.length; ui++) {
      const stars = 4 + ((pi + ui) % 2);
      await prisma.listingRating.create({
        data: {
          userId: SEED_REVIEWER_USERS[ui].id,
          listingId,
          stars,
          comment: SEED_REVIEW_COMMENTS[ui],
        },
      });
    }
    await recalculateListingRatingAggregate(prisma, listingId);
  }

  for (const promo of promotionSeeds) {
    const created = await prisma.promotion.create({
      data: {
        slug: promo.slug,
        title: promo.title,
        subtitle: promo.subtitle,
        badgeLabel: promo.badgeLabel,
        startsAt: promo.startsAt,
        endsAt: promo.endsAt,
        heroImageUrl: promo.heroImageUrl,
        sortOrder: promo.sortOrder,
        priority: promo.priority,
      },
    });
    await prisma.promotionListing.createMany({
      data: promo.listingSlugs.map((slug, i) => ({
        promotionId: created.id,
        listingId: slugToListingId[slug],
        sortOrder: i,
      })),
    });
  }

  const categoryAmharic: Record<(typeof categories)[number]["slug"], string> = {
    crochet: "ክሮሼ",
    jewelry: "ጌጣጌጥ",
    basketry: "የቅርብ ስራ",
    pottery: "የሸክራ ስራ",
    clothing: "ልብስ",
    "art-collectibles": "ጥበብ እና ስብስቦች",
  };

  await prisma.categoryTranslation.createMany({
    data: categoryRows.map((row) => ({
      categoryId: row.id,
      locale: ContentLocale.am,
      name: categoryAmharic[row.slug as (typeof categories)[number]["slug"]],
    })),
  });

  const tagAmharic: Partial<Record<(typeof tagDefinitions)[number]["slug"], string>> = {
    handmade: "በእጅ የተሰራ",
    new: "አዲስ",
    "gift-ready": "ለስጦታ",
    "editors-pick": "የአርታዒ ምርጫ",
  };

  for (const t of tagDefinitions) {
    const name = tagAmharic[t.slug];
    if (!name) continue;
    const row = await prisma.tag.findUnique({ where: { slug: t.slug } });
    if (!row) continue;
    await prisma.tagTranslation.create({
      data: {
        tagId: row.id,
        locale: ContentLocale.am,
        name,
      },
    });
  }

  const listingAmharic: Partial<
    Record<
      SeedListing["slug"],
      { name: string; description: string; variants?: Record<string, string> }
    >
  > = {
    "hand-glazed-stoneware-mug": {
      name: "በእጅ የተነከረ የድንጋይ ሸክራ ማንኪያ",
      description: "ከመኪና የወጣ ጥራት · በቬርሞንት የተሰራ",
      variants: { Celadon: "ሴላዶን", Rust: "ድንጋይ ቀለም" },
    },
    "hammered-sterling-silver-earrings": {
      name: "የተመታ የስተርሊንግ ብር ጉንድሮች",
      description: "ጠንካራ ብር · እያንዳንዱ ጥንድ ትንሽ የተለየ",
    },
    "hand-carved-wooden-coffee-scoop": {
      name: "በእጅ የተቀረጸ የእንጨት የቡና ማንኪያ",
      description: "የወይራ እንጨት · ለጀበና ሥርዓትዎ",
    },
  };

  for (const [slug, am] of Object.entries(listingAmharic)) {
    const listing = await prisma.listing.findUnique({
      where: { slug },
      include: { variants: true },
    });
    if (!listing) continue;
    await prisma.listingTranslation.create({
      data: {
        listingId: listing.id,
        locale: ContentLocale.am,
        name: am.name,
        description: am.description,
      },
    });
    if (am.variants) {
      for (const v of listing.variants) {
        const labelAm = am.variants[v.label];
        if (!labelAm) continue;
        await prisma.listingVariantTranslation.create({
          data: {
            variantId: v.id,
            locale: ContentLocale.am,
            label: labelAm,
          },
        });
      }
    }
  }

  const springPromo = await prisma.promotion.findUnique({
    where: { slug: "spring-home-edit" },
  });
  if (springPromo) {
    await prisma.promotionTranslation.create({
      data: {
        promotionId: springPromo.id,
        locale: ContentLocale.am,
        title: "የጸየቀ ወቅት የቤት ምርጫ",
        subtitle: "ለሞቀው ቀን የተመረጡ ዕቃዎች",
        badgeLabel: "የጸየቀ ቅናሽ",
      },
    });
  }

  console.log(
    `Seeded ${categories.length} categories, ${listings.length} listings, ${promotionSeeds.length} promotions.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/index.js");
    await prisma.$disconnect();
  });
