import { ContentLocale, Prisma } from "@prisma/client";
import type { Locale } from "@ys/intl";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import {
  assertSellerCanManageShop,
  assertShopActiveForPublish,
  getOwnedShop,
  requireUserId,
} from "../../lib/authz";
import { prisma } from "../../lib/db";
import {
  getProductDetailInclude,
  minVariantPrice,
} from "../catalog/product-card.mapper";
import { pickCategoryName, pickProductDescription, pickProductName, pickVariantLabel } from "../../lib/localized-catalog";
import { toNumber } from "../../lib/money";
import {
  serializeProductAttributeValuesForSeller,
  validateProductAttributeInputs,
} from "../../lib/category-attributes";
import { sellerProductCreateSchema, sellerProductPatchSchema } from "./seller.schema";

export const sellerRouter = new Hono();

async function resolveCategoryId(
  categorySlug: string | undefined,
  categoryId: string | undefined,
): Promise<string> {
  if (categoryId) {
    const c = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!c) throw new HTTPException(400, { message: "Category not found" });
    return c.id;
  }
  if (categorySlug) {
    const c = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!c) throw new HTTPException(400, { message: "Category not found" });
    return c.id;
  }
  throw new HTTPException(400, { message: "Category required" });
}

async function assertTagSlugsExist(tagSlugs: string[]): Promise<void> {
  const found = await prisma.tag.findMany({
    where: { slug: { in: tagSlugs } },
    select: { slug: true },
  });
  if (found.length !== tagSlugs.length) {
    throw new HTTPException(400, { message: "One or more tags not found" });
  }
}

sellerRouter.get("/seller/products", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);

  const locale = c.get("locale") as Locale;
  const tr =
    locale === "en"
      ? null
      : ({
          where: { locale: locale as ContentLocale },
        } as const);

  const products = await prisma.product.findMany({
    where: { shopId: shop.id },
    orderBy: { updatedAt: "desc" },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: tr ? { include: { translations: tr } } : true,
      ...(tr ? { translations: tr } : {}),
      category: tr ? { include: { translations: tr } } : true,
    },
  });

  return c.json({
    products: products.map((p) => {
      const minPrice = minVariantPrice(p.variants);
      const trList = p.translations ?? [];
      return {
        id: p.id,
        slug: p.slug,
        name: pickProductName({ name: p.name, translations: trList }, locale),
        description: pickProductDescription(
          { description: p.description, translations: trList },
          locale,
        ),
        isPublished: p.isPublished,
        featured: p.featured,
        rating: toNumber(p.rating),
        reviewCount: p.reviewCount,
        priceFrom: minPrice,
        imageUrl: p.images[0]?.url ?? "",
        category: {
          slug: p.category.slug,
          name: pickCategoryName(
            {
              name: p.category.name,
              translations: (p.category as { translations?: { name: string }[] }).translations ?? [],
            },
            locale,
          ),
        },
        updatedAt: p.updatedAt.toISOString(),
      };
    }),
  });
});

sellerRouter.post("/seller/products", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);

  const body = await c.req.json().catch(() => null);
  const parsed = sellerProductCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }
  const data = parsed.data;

  const categoryId = await resolveCategoryId(data.categorySlug, data.categoryId);
  if (data.tagSlugs?.length) {
    await assertTagSlugsExist(data.tagSlugs);
  }

  const isPublished = data.isPublished ?? false;
  if (isPublished) {
    assertShopActiveForPublish(shop);
  }

  const slugTaken = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (slugTaken) {
    throw new HTTPException(400, { message: "Slug already in use" });
  }

  const validatedAttributes = await validateProductAttributeInputs(
    categoryId,
    data.attributes ?? [],
  );

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        slug: data.slug,
        shopId: shop.id,
        categoryId,
        name: data.name,
        description: data.description,
        rating: new Prisma.Decimal("0"),
        reviewCount: 0,
        featured: data.featured ?? false,
        isPublished,
        images: {
          create: data.images.map((url, i) => ({
            url,
            sortOrder: i,
          })),
        },
        variants: {
          create: data.variants.map((v, i) => ({
            sku: v.sku ?? `${data.slug}-v${i}`,
            label: v.label,
            colorHex: v.colorHex,
            price: new Prisma.Decimal(String(v.price)),
            compareAtPrice:
              v.compareAtPrice != null ? new Prisma.Decimal(String(v.compareAtPrice)) : null,
            stock: v.stock,
          })),
        },
        ...(data.tagSlugs?.length
          ? {
              productTags: {
                create: data.tagSlugs.map((slug) => ({
                  tag: { connect: { slug } },
                })),
              },
            }
          : {}),
      },
      include: { variants: true },
    });

    if (validatedAttributes && validatedAttributes.length > 0) {
      await tx.productAttributeValue.createMany({
        data: validatedAttributes.map((v) => ({
          productId: created.id,
          definitionId: v.definitionId,
          allowedValueId: v.allowedValueId,
          textValue: v.textValue,
          numberValue: v.numberValue,
          booleanValue: v.booleanValue,
        })),
      });
    }

    if (data.translationAm) {
      await tx.productTranslation.create({
        data: {
          productId: created.id,
          locale: ContentLocale.am,
          name: data.translationAm.name,
          description: data.translationAm.description,
        },
      });
      for (let i = 0; i < data.variants.length; i++) {
        const v = data.variants[i]!;
        const variantRow = created.variants[i];
        if (!variantRow || !v.labelAm) continue;
        await tx.productVariantTranslation.create({
          data: {
            variantId: variantRow.id,
            locale: ContentLocale.am,
            label: v.labelAm,
          },
        });
      }
    }

    return created;
  });

  return c.json({ product: { id: product.id, slug: product.slug } });
});

sellerRouter.get("/seller/products/:id", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);

  const id = c.req.param("id");
  const locale = c.get("locale") as Locale;
  const now = new Date();

  const product = await prisma.product.findFirst({
    where: { id, shopId: shop.id },
    include: getProductDetailInclude(now, locale),
  });
  if (!product) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  const minPrice = minVariantPrice(product.variants);
  const tr = product.translations ?? [];
  const category = product.category as typeof product.category & {
    translations?: { name: string }[];
  };

  return c.json({
    product: {
      id: product.id,
      slug: product.slug,
      name: pickProductName({ name: product.name, translations: tr }, locale),
      description: pickProductDescription(
        { description: product.description, translations: tr },
        locale,
      ),
      isPublished: product.isPublished,
      featured: product.featured,
      rating: toNumber(product.rating),
      reviewCount: product.reviewCount,
      categoryId: product.categoryId,
      categorySlug: category.slug,
      images: product.images.map((i) => i.url),
      variants: product.variants.map((v) => {
        const vt = v as typeof v & { translations?: { label: string }[] };
        return {
          id: v.id,
          sku: v.sku,
          label: pickVariantLabel(
            { label: v.label, translations: vt.translations ?? [] },
            locale,
          ),
          colorHex: v.colorHex,
          price: toNumber(v.price),
          compareAtPrice: v.compareAtPrice != null ? toNumber(v.compareAtPrice) : undefined,
          stock: v.stock,
        };
      }),
      priceFrom: minPrice,
      tags: product.productTags.map((pt) => pt.tag.slug),
      attributes: serializeProductAttributeValuesForSeller(
        product.attributeValues.map((av) => ({
          definition: av.definition,
          allowedValue: av.allowedValue,
          textValue: av.textValue,
          numberValue: av.numberValue,
          booleanValue: av.booleanValue,
        })),
      ),
    },
  });
});

sellerRouter.patch("/seller/products/:id", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);

  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = sellerProductPatchSchema.safeParse(body);
  if (!parsed.success) {
    throw new HTTPException(400, { message: "Invalid body" });
  }

  const existing = await prisma.product.findFirst({
    where: { id, shopId: shop.id },
    include: { variants: true },
  });
  if (!existing) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  const data = parsed.data;
  if (data.slug != null && data.slug !== existing.slug) {
    const taken = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (taken) {
      throw new HTTPException(400, { message: "Slug already in use" });
    }
  }

  if (data.isPublished === true) {
    assertShopActiveForPublish(shop);
  }

  if (data.tagSlugs?.length) {
    await assertTagSlugsExist(data.tagSlugs);
  }

  const categoryId =
    data.categorySlug != null || data.categoryId != null
      ? await resolveCategoryId(data.categorySlug, data.categoryId)
      : undefined;

  const nextCategoryId = categoryId ?? existing.categoryId;

  const slugForSkus = data.slug ?? existing.slug;

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        ...(data.name != null ? { name: data.name } : {}),
        ...(data.description != null ? { description: data.description } : {}),
        ...(data.slug != null ? { slug: data.slug } : {}),
        ...(data.featured != null ? { featured: data.featured } : {}),
        ...(data.isPublished != null ? { isPublished: data.isPublished } : {}),
        ...(categoryId != null ? { categoryId } : {}),
      },
    });

    if (data.attributes !== undefined) {
      await tx.productAttributeValue.deleteMany({ where: { productId: id } });
      const validated = await validateProductAttributeInputs(nextCategoryId, data.attributes);
      if (validated && validated.length > 0) {
        await tx.productAttributeValue.createMany({
          data: validated.map((v) => ({
            productId: id,
            definitionId: v.definitionId,
            allowedValueId: v.allowedValueId,
            textValue: v.textValue,
            numberValue: v.numberValue,
            booleanValue: v.booleanValue,
          })),
        });
      }
    } else if (categoryId != null && categoryId !== existing.categoryId) {
      await tx.productAttributeValue.deleteMany({ where: { productId: id } });
    }

    if (data.images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productImage.createMany({
        data: data.images.map((url, i) => ({
          productId: id,
          url,
          sortOrder: i,
        })),
      });
    }

    if (data.tagSlugs) {
      await tx.productTag.deleteMany({ where: { productId: id } });
      const tags = await tx.tag.findMany({
        where: { slug: { in: data.tagSlugs } },
      });
      if (tags.length !== data.tagSlugs.length) {
        throw new HTTPException(400, { message: "One or more tags not found" });
      }
      await tx.productTag.createMany({
        data: tags.map((t) => ({
          productId: id,
          tagId: t.id,
        })),
      });
    }

    if (data.variants) {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      for (let i = 0; i < data.variants.length; i++) {
        const v = data.variants[i]!;
        const created = await tx.productVariant.create({
          data: {
            productId: id,
            sku: v.sku ?? `${slugForSkus}-v${i}`,
            label: v.label,
            colorHex: v.colorHex,
            price: new Prisma.Decimal(String(v.price)),
            compareAtPrice:
              v.compareAtPrice != null ? new Prisma.Decimal(String(v.compareAtPrice)) : null,
            stock: v.stock,
          },
        });
        if (v.labelAm) {
          await tx.productVariantTranslation.create({
            data: {
              variantId: created.id,
              locale: ContentLocale.am,
              label: v.labelAm,
            },
          });
        }
      }
    }

    if (data.translationAm) {
      await tx.productTranslation.upsert({
        where: {
          productId_locale: {
            productId: id,
            locale: ContentLocale.am,
          },
        },
        create: {
          productId: id,
          locale: ContentLocale.am,
          name: data.translationAm.name,
          description: data.translationAm.description,
        },
        update: {
          name: data.translationAm.name,
          description: data.translationAm.description,
        },
      });
    } else if (data.translationAm === null) {
      await tx.productTranslation.deleteMany({
        where: { productId: id, locale: ContentLocale.am },
      });
    }
  });

  return c.json({ ok: true });
});

sellerRouter.delete("/seller/products/:id", async (c) => {
  const userId = await requireUserId(c);
  const shop = await getOwnedShop(userId);
  if (!shop) {
    throw new HTTPException(404, { message: "No shop" });
  }
  assertSellerCanManageShop(shop, userId);

  const id = c.req.param("id");
  const existing = await prisma.product.findFirst({
    where: { id, shopId: shop.id },
  });
  if (!existing) {
    throw new HTTPException(404, { message: "Product not found" });
  }

  await prisma.product.delete({ where: { id } });
  return c.json({ ok: true });
});
