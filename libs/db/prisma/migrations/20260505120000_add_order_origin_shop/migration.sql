-- Add optional storefront origin metadata for shop-subdomain checkouts.
ALTER TABLE "orders" ADD COLUMN "origin_shop_id" TEXT;

CREATE INDEX "orders_origin_shop_id_idx" ON "orders"("origin_shop_id");

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_origin_shop_id_fkey"
  FOREIGN KEY ("origin_shop_id") REFERENCES "shops"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
