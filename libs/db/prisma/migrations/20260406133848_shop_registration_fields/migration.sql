-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "business_address_line1" TEXT,
ADD COLUMN     "business_address_line2" TEXT,
ADD COLUMN     "business_city" TEXT,
ADD COLUMN     "business_country" TEXT,
ADD COLUMN     "business_legal_name" TEXT,
ADD COLUMN     "business_postal_code" TEXT,
ADD COLUMN     "business_tax_id" TEXT,
ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "returns_policy" TEXT,
ADD COLUMN     "shipping_policy" TEXT,
ADD COLUMN     "social_links" JSONB;
