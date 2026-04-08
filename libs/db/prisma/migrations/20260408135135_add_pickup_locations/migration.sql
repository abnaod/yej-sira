-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "pickup_location_id" TEXT;

-- CreateTable
CREATE TABLE "pickup_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Ethiopia',
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pickup_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pickup_locations_sort_order_idx" ON "pickup_locations"("sort_order");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickup_location_id_fkey" FOREIGN KEY ("pickup_location_id") REFERENCES "pickup_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
