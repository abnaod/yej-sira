import { config } from "dotenv";
import {
  CategoryAttributeInputType,
  ContentLocale,
  Prisma,
  type PrismaClient,
} from "@prisma/client";

config({ path: "../../.env" });

const categories = [
  {
    slug: "jewelry-accessories",
    name: "Jewelry & Accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80",
    sortOrder: 0,
  },
  {
    slug: "home-living",
    name: "Home & Living",
    imageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
    sortOrder: 1,
  },
  {
    slug: "art-collectibles",
    name: "Art & Collectibles",
    imageUrl:
      "https://images.unsplash.com/photo-1503602642458-232111445657?w=400&q=80",
    sortOrder: 2,
  },
  {
    slug: "paper-party",
    name: "Paper & Party",
    imageUrl:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80",
    sortOrder: 3,
  },
  {
    slug: "vintage",
    name: "Vintage",
    imageUrl:
      "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=400&q=80",
    sortOrder: 4,
  },
  {
    slug: "clothing",
    name: "Clothing",
    imageUrl:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80",
    sortOrder: 5,
  },
] as const;

const tagDefinitions = [
  { slug: "handmade", name: "Handmade" },
  { slug: "new", name: "New" },
  { slug: "gift-ready", name: "Gift ready" },
  { slug: "editors-pick", name: "Editor's pick" },
] as const;

type SeedProduct = {
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
    heroImageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=80",
    sortOrder: 0,
    priority: 10,
    productSlugs: [
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
    heroImageUrl:
      "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=900&q=80",
    sortOrder: 1,
    priority: 0,
    productSlugs: ["botanical-embroidery-hoop-art", "original-watercolor-mini"] as const,
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
  "Great value; the product itself is lovely.",
] as const;

async function recalculateProductRatingAggregate(prisma: PrismaClient, productId: string) {
  const agg = await prisma.productRating.aggregate({
    where: { productId },
    _avg: { stars: true },
    _count: true,
  });
  const avg = agg._avg.stars ?? 0;
  const count = agg._count;
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: new Prisma.Decimal(count === 0 ? "0.00" : avg.toFixed(2)),
      reviewCount: count,
    },
  });
}

const products: SeedProduct[] = [
  {
    slug: "hand-glazed-stoneware-mug",
    categorySlug: "home-living",
    name: "Hand-glazed stoneware mug",
    description: "Wheel-thrown, food-safe glaze · Made in Vermont",
    featured: true,
    tagSlugs: ["handmade", "new"],
    images: [
      "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=600&q=80",
      "https://images.unsplash.com/photo-1503602642458-232111445657?w=600&q=80",
    ],
    variants: [
      { label: "Celadon", colorHex: "#A8C5BB", price: new Prisma.Decimal("36.00"), stock: 24 },
      { label: "Rust", colorHex: "#B85C38", price: new Prisma.Decimal("36.00"), stock: 12 },
    ],
  },
  {
    slug: "block-print-linen-pillow-cover",
    categorySlug: "home-living",
    name: "Block-print linen pillow cover",
    description: "Natural linen · Hand block printed in small batches",
    featured: true,
    tagSlugs: ["handmade", "gift-ready"],
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80",
    ],
    variants: [
      { label: "Indigo", colorHex: "#4A5D6B", price: new Prisma.Decimal("48.00"), stock: 30 },
    ],
  },
  {
    slug: "hammered-sterling-silver-earrings",
    categorySlug: "jewelry-accessories",
    name: "Hammered sterling silver earrings",
    description: "Solid sterling · Each pair slightly unique",
    featured: true,
    tagSlugs: ["handmade", "editors-pick"],
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80",
    ],
    variants: [
      { label: "Silver", colorHex: "#C0C0C0", price: new Prisma.Decimal("62.00"), stock: 18 },
    ],
  },
  {
    slug: "olive-wood-serving-board",
    categorySlug: "home-living",
    name: "Olive wood serving board",
    description: "Single piece of olive wood, hand oiled",
    featured: true,
    tagSlugs: ["handmade", "gift-ready"],
    images: [
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80",
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
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80",
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
      "https://images.unsplash.com/photo-1503602642458-232111445657?w=600&q=80",
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
      "https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=600&q=80",
    ],
    variants: [
      { label: "Natural undyed", colorHex: "#E8E4DC", price: new Prisma.Decimal("42.00"), stock: 40 },
    ],
  },
  {
    slug: "soy-wax-candle-trio-gift-set",
    categorySlug: "paper-party",
    name: "Soy wax candle trio, gift set",
    description: "Three 4 oz tins · Essential oil blends",
    featured: true,
    tagSlugs: ["gift-ready", "handmade"],
    images: [
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80",
    ],
    variants: [
      { label: "Lavender trio", price: new Prisma.Decimal("38.00"), stock: 22 },
    ],
  },
  {
    slug: "hand-carved-wooden-coffee-scoop",
    categorySlug: "home-living",
    name: "Hand-carved wooden coffee scoop",
    description: "Olive wood · For your jebena ritual",
    featured: true,
    tagSlugs: ["handmade", "gift-ready"],
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80",
    ],
    variants: [
      { label: "Olive", colorHex: "#6B5A45", price: new Prisma.Decimal("22.00"), stock: 50 },
    ],
  },
  {
    slug: "natural-beeswax-taper-pair",
    categorySlug: "paper-party",
    name: "Natural beeswax taper pair",
    description: "Dipped by hand · Unscented",
    featured: true,
    tagSlugs: ["handmade"],
    images: [
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
    ],
    variants: [
      { label: "Natural", price: new Prisma.Decimal("18.00"), stock: 60 },
    ],
  },
  {
    slug: "woven-grass-storage-basket",
    categorySlug: "home-living",
    name: "Woven grass storage basket",
    description: "Fair trade · Natural dye accents",
    featured: true,
    tagSlugs: ["handmade", "gift-ready"],
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    ],
    variants: [
      { label: "Natural", price: new Prisma.Decimal("34.00"), stock: 25 },
    ],
  },
  {
    slug: "screen-printed-cotton-tea-towel",
    categorySlug: "paper-party",
    name: "Screen-printed cotton tea towel",
    description: "Ethiopian motifs · Machine washable",
    featured: true,
    tagSlugs: ["handmade"],
    images: [
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80",
    ],
    variants: [
      { label: "Ivory", price: new Prisma.Decimal("16.00"), stock: 100 },
    ],
  },
  {
    slug: "macrame-wall-hanging",
    categorySlug: "home-living",
    name: "Macramé wall hanging",
    description: "100% cotton cord · Handwoven to order",
    featured: false,
    tagSlugs: ["handmade", "new"],
    images: [
      "https://images.unsplash.com/photo-1622372738946-62e02505feb3?w=600&q=80",
    ],
    variants: [
      { label: "Natural", price: new Prisma.Decimal("78.00"), stock: 10 },
    ],
  },
  {
    slug: "ceramic-speckled-vase",
    categorySlug: "home-living",
    name: "Ceramic speckled vase",
    description: "Hand-thrown stoneware · Matte finish",
    featured: false,
    tagSlugs: ["handmade"],
    images: [
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&q=80",
    ],
    variants: [
      { label: "Speckled white", price: new Prisma.Decimal("44.00"), stock: 14 },
    ],
  },
  {
    slug: "woven-rattan-basket-set",
    categorySlug: "home-living",
    name: "Woven rattan basket set",
    description: "Set of 3 · Natural rattan · Fair trade",
    featured: false,
    tagSlugs: ["gift-ready", "handmade"],
    images: [
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&q=80",
    ],
    variants: [
      { label: "Natural", price: new Prisma.Decimal("56.00"), stock: 9 },
    ],
  },
  {
    slug: "hand-poured-soy-candle",
    categorySlug: "paper-party",
    name: "Hand-poured soy candle",
    description: "Lavender & sage · 50-hour burn time",
    featured: false,
    tagSlugs: ["handmade", "gift-ready"],
    images: [
      "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&q=80",
    ],
    variants: [
      { label: "Lavender & sage", price: new Prisma.Decimal("28.00"), stock: 45 },
    ],
  },
  {
    slug: "airpods-max",
    categorySlug: "jewelry-accessories",
    name: "Airpods Max",
    description:
      "A perfect balance of exhilarating high-fidelity audio and the effortless magic of AirPods.",
    featured: false,
    tagSlugs: ["new", "editors-pick"],
    images: [
      "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=600&q=80",
      "https://images.unsplash.com/photo-1503602642458-232111445657?w=600&q=80",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80",
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
      slug: "jewelry-accessories",
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
      slug: "home-living",
      defs: [
        {
          key: "room",
          inputType: CategoryAttributeInputType.select,
          sortOrder: 0,
          isRequired: false,
          labels: { en: "Room", am: "ክፍል" },
          options: [
            { key: "kitchen", labels: { en: "Kitchen", am: "ማዕድ" } },
            { key: "living", labels: { en: "Living room", am: "መኖሪያ" } },
            { key: "bedroom", labels: { en: "Bedroom", am: "መኝታ" } },
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
    {
      slug: "paper-party",
      defs: [
        {
          key: "occasion",
          inputType: CategoryAttributeInputType.select,
          sortOrder: 0,
          isRequired: false,
          labels: { en: "Occasion", am: "ዝግጅት" },
          options: [
            { key: "wedding", labels: { en: "Wedding", am: "ሰርግ" } },
            { key: "birthday", labels: { en: "Birthday", am: "የልደት" } },
            { key: "holiday", labels: { en: "Holiday", am: "በዓል" } },
          ],
        },
      ],
    },
    {
      slug: "vintage",
      defs: [
        {
          key: "era",
          inputType: CategoryAttributeInputType.select,
          sortOrder: 0,
          isRequired: false,
          labels: { en: "Era", am: "ዘመን" },
          options: [
            { key: "pre1950", labels: { en: "Pre-1950", am: "ከ1950 በፊት" } },
            { key: "1950-1990", labels: { en: "1950–1990", am: "1950–1990" } },
            { key: "1990plus", labels: { en: "1990+", am: "1990+" } },
          ],
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

async function seedSampleProductAttributes(
  prisma: PrismaClient,
  slugToProductId: Record<string, string>,
  slugToCategoryId: Record<string, string>,
) {
  const jewelryId = slugToCategoryId["jewelry-accessories"];
  const earringsId = slugToProductId["hammered-sterling-silver-earrings"];
  if (!jewelryId || !earringsId) return;

  const matDef = await prisma.categoryAttributeDefinition.findFirst({
    where: { categoryId: jewelryId, key: "material" },
    include: { allowedValues: true },
  });
  const silver = matDef?.allowedValues.find((v) => v.key === "silver");
  if (matDef && silver) {
    await prisma.productAttributeValue.create({
      data: {
        productId: earringsId,
        definitionId: matDef.id,
        allowedValueId: silver.id,
      },
    });
  }

  const careDef = await prisma.categoryAttributeDefinition.findFirst({
    where: { categoryId: jewelryId, key: "care_instructions" },
  });
  if (careDef) {
    await prisma.productAttributeValue.create({
      data: {
        productId: earringsId,
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
    prisma.productImage.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
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

  for (const p of products) {
    const categoryId = slugToCategoryId[p.categorySlug];
    if (!categoryId) throw new Error(`Missing category ${p.categorySlug}`);

    await prisma.product.create({
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
        productTags: {
          create: p.tagSlugs.map((slug) => ({
            tag: { connect: { slug } },
          })),
        },
      },
    });
  }

  const slugToProductId: Record<string, string> = {};
  for (const p of products) {
    const row = await prisma.product.findUnique({
      where: { slug: p.slug },
      select: { id: true },
    });
    if (row) slugToProductId[p.slug] = row.id;
  }

  await seedSampleProductAttributes(prisma, slugToProductId, slugToCategoryId);

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

  for (let pi = 0; pi < products.length; pi++) {
    const p = products[pi];
    const productId = slugToProductId[p.slug];
    if (!productId) continue;
    for (let ui = 0; ui < SEED_REVIEWER_USERS.length; ui++) {
      const stars = 4 + ((pi + ui) % 2);
      await prisma.productRating.create({
        data: {
          userId: SEED_REVIEWER_USERS[ui].id,
          productId,
          stars,
          comment: SEED_REVIEW_COMMENTS[ui],
        },
      });
    }
    await recalculateProductRatingAggregate(prisma, productId);
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
    await prisma.promotionProduct.createMany({
      data: promo.productSlugs.map((slug, i) => ({
        promotionId: created.id,
        productId: slugToProductId[slug],
        sortOrder: i,
      })),
    });
  }

  const categoryAmharic: Partial<Record<(typeof categories)[number]["slug"], string>> = {
    "jewelry-accessories": "ጌ ውላጅ እና ማስዋቢያዎች",
    "home-living": "ቤት እና ህይወት",
    "art-collectibles": "ጥበብ እና ስብስቦች",
    "paper-party": "ወረቀት እና ድግስ",
    vintage: "ቬንቴጅ",
    clothing: "ልብስ",
  };

  await prisma.categoryTranslation.createMany({
    data: categoryRows
      .map((row) => {
        const name = categoryAmharic[row.slug as keyof typeof categoryAmharic];
        if (!name) return null;
        return {
          categoryId: row.id,
          locale: ContentLocale.am,
          name,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null),
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

  const productAmharic: Partial<
    Record<
      SeedProduct["slug"],
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

  for (const [slug, am] of Object.entries(productAmharic)) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { variants: true },
    });
    if (!product) continue;
    await prisma.productTranslation.create({
      data: {
        productId: product.id,
        locale: ContentLocale.am,
        name: am.name,
        description: am.description,
      },
    });
    if (am.variants) {
      for (const v of product.variants) {
        const labelAm = am.variants[v.label];
        if (!labelAm) continue;
        await prisma.productVariantTranslation.create({
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
    `Seeded ${categories.length} categories, ${products.length} products, ${promotionSeeds.length} promotions.`,
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
