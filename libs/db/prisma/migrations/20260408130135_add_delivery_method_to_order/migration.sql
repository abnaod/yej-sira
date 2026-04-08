-- CreateEnum
CREATE TYPE "delivery_method" AS ENUM ('standard', 'express', 'pickup');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "delivery_method" "delivery_method" NOT NULL DEFAULT 'standard';
