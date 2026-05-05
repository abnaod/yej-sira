-- CreateEnum
CREATE TYPE "conversation_outcome" AS ENUM ('open', 'purchased', 'no_response', 'price_too_high', 'changed_mind', 'other');

-- CreateEnum
CREATE TYPE "message_kind" AS ENUM ('text', 'system', 'intent', 'quick_action', 'agreement_nudge');

-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "response_rate" DECIMAL(4,3),
ADD COLUMN     "response_time_avg_seconds" INTEGER;

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "buyer_user_id" TEXT NOT NULL,
    "seller_shop_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" "conversation_outcome" NOT NULL DEFAULT 'open',
    "outcome_asked_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_user_id" TEXT NOT NULL,
    "kind" "message_kind" NOT NULL DEFAULT 'text',
    "body" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participant_states" (
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_read_message_id" TEXT,

    CONSTRAINT "conversation_participant_states_pkey" PRIMARY KEY ("conversation_id","user_id")
);

-- CreateIndex
CREATE INDEX "conversations_seller_shop_id_last_message_at_idx" ON "conversations"("seller_shop_id", "last_message_at");

-- CreateIndex
CREATE INDEX "conversations_buyer_user_id_last_message_at_idx" ON "conversations"("buyer_user_id", "last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_buyer_user_id_listing_id_key" ON "conversations"("buyer_user_id", "listing_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "conversation_participant_states_user_id_idx" ON "conversation_participant_states"("user_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyer_user_id_fkey" FOREIGN KEY ("buyer_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_seller_shop_id_fkey" FOREIGN KEY ("seller_shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participant_states" ADD CONSTRAINT "conversation_participant_states_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participant_states" ADD CONSTRAINT "conversation_participant_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participant_states" ADD CONSTRAINT "conversation_participant_states_last_read_message_id_fkey" FOREIGN KEY ("last_read_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
