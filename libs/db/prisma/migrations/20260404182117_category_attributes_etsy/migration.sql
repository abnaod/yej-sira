-- CreateEnum
CREATE TYPE "category_attribute_input_type" AS ENUM ('select', 'text', 'number', 'boolean');

-- CreateTable
CREATE TABLE "category_attribute_definitions" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "input_type" "category_attribute_input_type" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "category_attribute_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_attribute_definition_translations" (
    "id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "locale" "content_locale" NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "category_attribute_definition_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_allowed_values" (
    "id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "attribute_allowed_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_allowed_value_translations" (
    "id" TEXT NOT NULL,
    "allowed_value_id" TEXT NOT NULL,
    "locale" "content_locale" NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "attribute_allowed_value_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attribute_values" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "allowed_value_id" TEXT,
    "textValue" TEXT,
    "numberValue" DECIMAL(12,4),
    "booleanValue" BOOLEAN,

    CONSTRAINT "product_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_attribute_definitions_category_id_idx" ON "category_attribute_definitions"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_attribute_definitions_category_id_key_key" ON "category_attribute_definitions"("category_id", "key");

-- CreateIndex
CREATE INDEX "category_attribute_definition_translations_definition_id_idx" ON "category_attribute_definition_translations"("definition_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_attribute_definition_translations_definition_id_lo_key" ON "category_attribute_definition_translations"("definition_id", "locale");

-- CreateIndex
CREATE INDEX "attribute_allowed_values_definition_id_idx" ON "attribute_allowed_values"("definition_id");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_allowed_values_definition_id_key_key" ON "attribute_allowed_values"("definition_id", "key");

-- CreateIndex
CREATE INDEX "attribute_allowed_value_translations_allowed_value_id_idx" ON "attribute_allowed_value_translations"("allowed_value_id");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_allowed_value_translations_allowed_value_id_local_key" ON "attribute_allowed_value_translations"("allowed_value_id", "locale");

-- CreateIndex
CREATE INDEX "product_attribute_values_product_id_idx" ON "product_attribute_values"("product_id");

-- CreateIndex
CREATE INDEX "product_attribute_values_definition_id_idx" ON "product_attribute_values"("definition_id");

-- CreateIndex
CREATE INDEX "product_attribute_values_allowed_value_id_idx" ON "product_attribute_values"("allowed_value_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_values_product_id_definition_id_key" ON "product_attribute_values"("product_id", "definition_id");

-- AddForeignKey
ALTER TABLE "category_attribute_definitions" ADD CONSTRAINT "category_attribute_definitions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attribute_definition_translations" ADD CONSTRAINT "category_attribute_definition_translations_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "category_attribute_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_allowed_values" ADD CONSTRAINT "attribute_allowed_values_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "category_attribute_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_allowed_value_translations" ADD CONSTRAINT "attribute_allowed_value_translations_allowed_value_id_fkey" FOREIGN KEY ("allowed_value_id") REFERENCES "attribute_allowed_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "category_attribute_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_allowed_value_id_fkey" FOREIGN KEY ("allowed_value_id") REFERENCES "attribute_allowed_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
