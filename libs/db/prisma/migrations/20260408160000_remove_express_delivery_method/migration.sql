-- Reassign any express orders to standard (delivery), then drop express from enum.
UPDATE "orders" SET "delivery_method" = 'standard' WHERE "delivery_method" = 'express';

-- Replace enum: PostgreSQL cannot DROP enum value in place.
ALTER TABLE "orders" ALTER COLUMN "delivery_method" DROP DEFAULT;

CREATE TYPE "delivery_method_new" AS ENUM ('standard', 'pickup');

ALTER TABLE "orders"
  ALTER COLUMN "delivery_method" TYPE "delivery_method_new"
  USING ("delivery_method"::text::"delivery_method_new");

DROP TYPE "delivery_method";

ALTER TYPE "delivery_method_new" RENAME TO "delivery_method";

ALTER TABLE "orders" ALTER COLUMN "delivery_method" SET DEFAULT 'standard'::"delivery_method";
