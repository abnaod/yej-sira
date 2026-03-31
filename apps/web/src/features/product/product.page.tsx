import { getRouteApi } from "@tanstack/react-router";

import { ProductListItem } from "@/components/ui/product-list-item";
import { BuyBox } from "./components/buy-box";
import { ProductGallery } from "./components/product-gallery";

const routeApi = getRouteApi("/products/$productId");

const vaseGlazes = [
  { name: "Celadon", value: "#8FA395" },
  { name: "Terracotta", value: "#C67B5C" },
  { name: "Cream", value: "#E8E0D5" },
  { name: "Slate", value: "#5C6670" },
];

const relatedProducts = [
  {
    name: "Hand-glazed stoneware mug",
    price: 36.0,
    imageUrl:
      "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=100&q=80",
    rating: 5,
    reviewCount: 214,
  },
  {
    name: "Block-print linen pillow cover",
    price: 48.0,
    imageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&q=80",
    rating: 4.5,
    reviewCount: 89,
  },
  {
    name: "Olive wood serving board",
    price: 54.0,
    imageUrl:
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=100&q=80",
    rating: 4.5,
    reviewCount: 72,
  },
  {
    name: "Botanical embroidery hoop art",
    price: 44.0,
    originalPrice: 52.0,
    imageUrl:
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=100&q=80",
    rating: 5,
    reviewCount: 203,
  },
  {
    name: "Soy wax candle trio",
    price: 38.0,
    imageUrl:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=100&q=80",
    rating: 5,
    reviewCount: 95,
  },
];

const galleryImages = [
  "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=600&q=80",
  "https://images.unsplash.com/photo-1503602642458-232111445657?w=600&q=80",
  "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80",
];

export function ProductPage() {
  const { productId } = routeApi.useParams();

  return (
    <main>
      <p className="mb-4 text-xs text-muted-foreground">Listing {productId}</p>
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery
          images={galleryImages}
          productName="Hand-glazed stoneware vase"
        />

        <BuyBox
          name="Hand-glazed stoneware vase"
          price={68.0}
          rating={4.5}
          reviewCount={121}
          colors={vaseGlazes}
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold tracking-tight md:text-2xl">
          Related Products
        </h2>
        <div className="space-y-2">
          {relatedProducts.map((product, i) => (
            <ProductListItem key={i} {...product} />
          ))}
        </div>
      </section>
    </main>
  );
}
