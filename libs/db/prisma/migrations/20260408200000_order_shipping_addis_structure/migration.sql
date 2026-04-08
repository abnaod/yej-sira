-- Addis Ababa delivery structure: city, subcity, woreda, kebele, specific location.

ALTER TABLE "orders" ADD COLUMN "shipping_subcity" TEXT;
ALTER TABLE "orders" ADD COLUMN "shipping_woreda" TEXT;
ALTER TABLE "orders" ADD COLUMN "shipping_kebele" TEXT;
ALTER TABLE "orders" ADD COLUMN "shipping_specific_location" TEXT;

UPDATE "orders" SET
  "shipping_specific_location" = COALESCE(NULLIF(TRIM("shipping_line1"), ''), '—'),
  "shipping_subcity" = COALESCE(NULLIF(TRIM("shipping_line2"), ''), ''),
  "shipping_woreda" = '',
  "shipping_kebele" = '';

ALTER TABLE "orders" ALTER COLUMN "shipping_subcity" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "shipping_woreda" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "shipping_kebele" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "shipping_specific_location" SET NOT NULL;

ALTER TABLE "orders" DROP COLUMN "shipping_line1";
ALTER TABLE "orders" DROP COLUMN "shipping_line2";
ALTER TABLE "orders" DROP COLUMN "shipping_postal_code";
ALTER TABLE "orders" DROP COLUMN "shipping_country";
