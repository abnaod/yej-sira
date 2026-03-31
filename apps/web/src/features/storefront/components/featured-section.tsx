import { ProductCard } from "@/components/ui/product-card";

const featuredProducts = [
  {
    id: "1",
    name: "Hand-glazed stoneware mug",
    price: 36.0,
    description: "Wheel-thrown, food-safe glaze · Made in Vermont",
    imageUrl:
      "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=300&q=80",
    rating: 5,
    reviewCount: 214,
  },
  {
    id: "2",
    name: "Block-print linen pillow cover",
    price: 48.0,
    description: "Natural linen · Hand block printed in small batches",
    imageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&q=80",
    rating: 4.5,
    reviewCount: 89,
  },
  {
    id: "3",
    name: "Hammered sterling silver earrings",
    price: 62.0,
    description: "Solid sterling · Each pair slightly unique",
    imageUrl:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&q=80",
    rating: 5,
    reviewCount: 156,
  },
  {
    id: "4",
    name: "Olive wood serving board",
    price: 54.0,
    description: "Single piece of olive wood, hand oiled",
    imageUrl:
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300&q=80",
    rating: 4.5,
    reviewCount: 72,
  },
  {
    id: "5",
    name: "Botanical embroidery hoop art",
    price: 44.0,
    description: "Cotton floss on linen · 8\" hoop, ready to hang",
    imageUrl:
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=300&q=80",
    rating: 5,
    reviewCount: 203,
  },
  {
    id: "6",
    name: "Original watercolor mini",
    price: 28.0,
    description: "Signed by the artist · Archival paper",
    imageUrl:
      "https://images.unsplash.com/photo-1503602642458-232111445657?w=300&q=80",
    rating: 4.5,
    reviewCount: 41,
  },
  {
    id: "7",
    name: "Handwoven cotton market tote",
    price: 42.0,
    description: "Heavyweight cotton · Reinforced straps",
    imageUrl:
      "https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=300&q=80",
    rating: 4.5,
    reviewCount: 128,
  },
  {
    id: "8",
    name: "Soy wax candle trio, gift set",
    price: 38.0,
    description: "Three 4 oz tins · Essential oil blends",
    imageUrl:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&q=80",
    rating: 5,
    reviewCount: 95,
  },
  {
    id: "9",
    name: "Hand-carved wooden coffee scoop",
    price: 22.0,
    description: "Olive wood · For your jebena ritual",
    imageUrl:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&q=80",
    rating: 4.5,
    reviewCount: 67,
  },
  {
    id: "10",
    name: "Natural beeswax taper pair",
    price: 18.0,
    description: "Dipped by hand · Unscented",
    imageUrl:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&q=80",
    rating: 5,
    reviewCount: 54,
  },
  {
    id: "11",
    name: "Woven grass storage basket",
    price: 34.0,
    description: "Fair trade · Natural dye accents",
    imageUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80",
    rating: 4.5,
    reviewCount: 112,
  },
  {
    id: "12",
    name: "Screen-printed cotton tea towel",
    price: 16.0,
    description: "Ethiopian motifs · Machine washable",
    imageUrl:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&q=80",
    rating: 4.5,
    reviewCount: 88,
  },
];

export function FeaturedSection() {
  return (
    <section>
      <h2 className="text-xl font-bold tracking-tight md:text-2xl">
        Handpicked for you
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
}
