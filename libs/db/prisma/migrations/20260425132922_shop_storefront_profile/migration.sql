-- Storefront profile fields used by the public shop page.
ALTER TABLE "shops"
  ADD COLUMN "banner_image_url" TEXT,
  ADD COLUMN "accent_color" TEXT;
