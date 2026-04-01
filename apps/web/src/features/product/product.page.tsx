import { getRouteApi } from "@tanstack/react-router";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProductListItem } from "@/components/ui/product-list-item";
import { BuyBox } from "./components/buy-box";
import { ProductGallery } from "./components/product-gallery";

const routeApi = getRouteApi("/products/$productId");

const productColors = [
  { name: "Red", value: "#E4605E" },
  { name: "Space Gray", value: "#4A4E51" },
  { name: "Green", value: "#8DB48E" },
  { name: "Silver", value: "#D2D3D5" },
  { name: "Sky Blue", value: "#6B98B7" },
];

const relatedProducts = [
  {
    id: "1",
    name: "Hand-glazed stoneware mug",
    price: 36.0,
    imageUrl:
      "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=100&q=80",
    rating: 5,
    reviewCount: 214,
  },
  {
    id: "2",
    name: "Block-print linen pillow cover",
    price: 48.0,
    imageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&q=80",
    rating: 4.5,
    reviewCount: 89,
  },
  {
    id: "3",
    name: "Olive wood serving board",
    price: 54.0,
    imageUrl:
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=100&q=80",
    rating: 4.5,
    reviewCount: 72,
  },
  {
    id: "5",
    name: "Botanical embroidery hoop art",
    price: 44.0,
    originalPrice: 52.0,
    imageUrl:
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=100&q=80",
    rating: 5,
    reviewCount: 203,
  },
  {
    id: "8",
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
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
  "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80",
];

const breadcrumbItems = [
  { label: "Electronics", href: "/" },
  { label: "Audio", href: "/" },
  { label: "Headphones", href: "/" },
  { label: "Shop Headphones by type", href: "/" },
];

export function ProductPage() {
  const { productId } = routeApi.useParams();

  return (
    <main>
      <Breadcrumb
        items={[...breadcrumbItems, { label: productId }]}
        className="mb-6"
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery
          images={galleryImages}
          productName="Airpods Max"
        />

        <BuyBox
          name="Airpods Max"
          description="A perfect balance of exhilarating high-fidelity audio and the effortless magic of AirPods."
          price={549.0}
          monthlyPrice={99.99}
          financingNote="Suggested payments with 6 months special financing"
          rating={5}
          reviewCount={121}
          colors={productColors}
          stock={12}
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
