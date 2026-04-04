import { config } from "dotenv";
import { Prisma } from "@prisma/client";

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
  rating: Prisma.Decimal;
  reviewCount: number;
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

const products: SeedProduct[] = [
  {
    slug: "hand-glazed-stoneware-mug",
    categorySlug: "home-living",
    name: "Hand-glazed stoneware mug",
    description: "Wheel-thrown, food-safe glaze · Made in Vermont",
    rating: new Prisma.Decimal("5.0"),
    reviewCount: 214,
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
    rating: new Prisma.Decimal("4.5"),
    reviewCount: 89,
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
    rating: new Prisma.Decimal("5.0"),
    reviewCount: 156,
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
    rating: new Prisma.Decimal("4.5"),
    reviewCount: 72,
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
    rating: new Prisma.Decimal("5.0"),
    reviewCount: 203,
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
    rating: new Prisma.Decimal("4.5"),
    reviewCount: 41,
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
    rating: new Prisma.Decimal("4.5"),
    reviewCount: 128,
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
    rating: new Prisma.Decimal("5.0"),
    reviewCount: 95,
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
    rating: new Prisma.Decimal("4.5"),
    reviewCount: 67,
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
    rating: new Prisma.Decimal("5.0"),
    reviewCount: 54,
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
    rating: new Prisma.Decimal("4.5"),
    reviewCount: 112,
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
    rating: new Prisma.Decimal("4.5"),
    reviewCount: 88,
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
    rating: new Prisma.Decimal("4.5"),
    reviewCount: 134,
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
    rating: new Prisma.Decimal("5.0"),
    reviewCount: 98,
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
    rating: new Prisma.Decimal("4.0"),
    reviewCount: 63,
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
    rating: new Prisma.Decimal("5.0"),
    reviewCount: 312,
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
    rating: new Prisma.Decimal("5.0"),
    reviewCount: 121,
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

async function main() {
  const { prisma } = await import("../src/index.js");

  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.promotion.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
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

  await prisma.tag.createMany({
    data: tagDefinitions.map((t) => ({ slug: t.slug, name: t.name })),
  });

  for (const p of products) {
    const categoryId = slugToCategoryId[p.categorySlug];
    if (!categoryId) throw new Error(`Missing category ${p.categorySlug}`);

    await prisma.product.create({
      data: {
        slug: p.slug,
        categoryId,
        name: p.name,
        description: p.description,
        rating: p.rating,
        reviewCount: p.reviewCount,
        featured: p.featured,
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
    await prisma.$disconnect();
  });
