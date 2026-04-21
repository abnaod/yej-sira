-- Shop onboarding (Phase 2)
ALTER TABLE "shops"
  ADD COLUMN "accepted_seller_policy_at" TIMESTAMP(3),
  ADD COLUMN "payout_method" TEXT,
  ADD COLUMN "payout_account_name" TEXT,
  ADD COLUMN "payout_account_number" TEXT,
  ADD COLUMN "payout_bank_code" TEXT,
  ADD COLUMN "onboarding_completed_at" TIMESTAMP(3);

-- Cart applied promo + PromoCode model (Phase 3)
ALTER TABLE "carts" ADD COLUMN "applied_promo_code" TEXT;

CREATE TABLE "promo_codes" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "discount_percent" INTEGER,
  "discount_amount" DECIMAL(10,2),
  "min_subtotal" DECIMAL(10,2),
  "max_redemptions" INTEGER,
  "per_user_limit" INTEGER,
  "redemptions" INTEGER NOT NULL DEFAULT 0,
  "valid_from" TIMESTAMP(3),
  "valid_until" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");
CREATE INDEX "promo_codes_code_idx" ON "promo_codes"("code");

-- Orders idempotency key (Phase 3)
ALTER TABLE "orders" ADD COLUMN "idempotency_key" TEXT;
CREATE INDEX "orders_idempotency_key_idx" ON "orders"("idempotency_key");
