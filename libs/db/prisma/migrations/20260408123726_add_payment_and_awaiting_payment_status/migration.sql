-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('card', 'telebirr');

-- AlterEnum
ALTER TYPE "order_status" ADD VALUE 'awaiting_payment';

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "tx_ref" TEXT NOT NULL,
    "chapa_ref" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "status" "payment_status" NOT NULL DEFAULT 'pending',
    "payment_method" "payment_method",
    "chapa_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_tx_ref_key" ON "payments"("tx_ref");

-- CreateIndex
CREATE INDEX "payments_tx_ref_idx" ON "payments"("tx_ref");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
