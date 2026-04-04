-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('customer', 'admin');

-- CreateEnum
CREATE TYPE "shop_status" AS ENUM ('pending', 'active', 'rejected', 'suspended');

-- AlterTable
ALTER TABLE "user" ADD COLUMN "role" "user_role" NOT NULL DEFAULT 'customer';

-- CreateTable
CREATE TABLE "shops" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "owner_user_id" TEXT,
    "status" "shop_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shops_slug_key" ON "shops"("slug");

-- CreateIndex
CREATE INDEX "shops_status_idx" ON "shops"("status");

-- CreateIndex
CREATE UNIQUE INDEX "shops_owner_user_id_key" ON "shops"("owner_user_id");

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Platform shop for existing catalog rows
INSERT INTO "shops" ("id", "slug", "name", "description", "image_url", "owner_user_id", "status", "created_at", "updated_at")
VALUES (gen_random_uuid()::text, 'yej-sira', 'Yej Sira', 'Curated marketplace catalog', NULL, NULL, 'active', NOW(), NOW());

-- AlterTable
ALTER TABLE "products" ADD COLUMN "is_published" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "shop_id" TEXT;

UPDATE "products"
SET
    "shop_id" = (SELECT "id" FROM "shops" WHERE "slug" = 'yej-sira' LIMIT 1),
    "is_published" = true;

ALTER TABLE "products" ALTER COLUMN "shop_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "products_shop_id_idx" ON "products"("shop_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
