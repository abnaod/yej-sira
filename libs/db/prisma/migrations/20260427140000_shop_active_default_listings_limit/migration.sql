-- AlterTable
ALTER TABLE "shops" ALTER COLUMN "status" SET DEFAULT 'active';

-- AlterTable
ALTER TABLE "shops" ADD COLUMN "listings_limit" INTEGER NOT NULL DEFAULT 20;
