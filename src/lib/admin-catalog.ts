import "server-only";
import fs from "node:fs";
import path from "node:path";
import { prisma, isUniqueConstraint } from "@/lib/db";
import { productSvg, categorySvg } from "@/lib/art";
import { productSchema, categorySchema } from "@/lib/validators";
import { s3Configured, uploadPublicObject } from "@/lib/storage";

function storageRequired(): void {
  if (process.env.NODE_ENV === "production" && !s3Configured()) {
    const error = new Error("Image storage is not configured.");
    (error as Error & { status?: number }).status = 500;
    throw error;
  }
}

export async function ensureProductArt(slug: string, name: string): Promise<string> {
  storageRequired();
  if (s3Configured()) {
    return uploadPublicObject(
      `media/products/${slug}.svg`,
      Buffer.from(productSvg(name)),
      "image/svg+xml",
      "public, max-age=86400",
    );
  }
  const dir = path.join(process.cwd(), "public", "media", "products");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${slug}.svg`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, productSvg(name));
  return `/media/products/${slug}.svg`;
}

export async function ensureCategoryArt(slug: string, name: string): Promise<string> {
  storageRequired();
  if (s3Configured()) {
    return uploadPublicObject(
      `media/categories/${slug}.svg`,
      Buffer.from(categorySvg(name)),
      "image/svg+xml",
      "public, max-age=86400",
    );
  }
  const dir = path.join(process.cwd(), "public", "media", "categories");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${slug}.svg`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, categorySvg(name));
  return `/media/categories/${slug}.svg`;
}

export async function saveProduct(input: unknown, id?: string) {
  const parsed = productSchema.parse(input);
  const images = (parsed.images.length
    ? parsed.images
    : [{ url: await ensureProductArt(parsed.slug, parsed.name), alt: parsed.name }]
  ).map((image, index) => ({
    url: image.url,
    alt: image.alt || parsed.name,
    sortOrder: index,
  }));
  const data = {
    name: parsed.name,
    slug: parsed.slug,
    sku: parsed.sku,
    description: parsed.description,
    shortDescription: parsed.shortDescription || "",
    price: parsed.price,
    compareAtPrice: parsed.compareAtPrice ?? null,
    stock: parsed.variants.length ? 0 : parsed.stock,
    categoryId: parsed.categoryId,
    specifications: JSON.stringify(parsed.specifications),
    isActive: parsed.isActive,
    isFeatured: parsed.isFeatured,
    wholesaleEligible: parsed.wholesaleEligible,
    minOrderQty: parsed.wholesaleEligible ? parsed.minOrderQty ?? null : null,
    wholesalePrice: parsed.wholesaleEligible ? parsed.wholesalePrice ?? null : null,
  };
  try {
    if (!id) {
      return await prisma.product.create({
        data: {
          ...data,
          images: { create: images },
          variants: { create: parsed.variants.map((variant) => ({ name: variant.name, sku: variant.sku, price: variant.price ?? null, stock: variant.stock })) },
        },
      });
    }
    return await prisma.product.update({
      where: { id },
      data: {
        ...data,
        images: { deleteMany: {}, create: images },
        variants: { deleteMany: {}, create: parsed.variants.map((variant) => ({ name: variant.name, sku: variant.sku, price: variant.price ?? null, stock: variant.stock })) },
      },
    });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      const failure = new Error("That slug or SKU is already used.");
      (failure as Error & { status?: number }).status = 400;
      throw failure;
    }
    throw error;
  }
}

export async function saveCategory(input: unknown, id?: string) {
  const parsed = categorySchema.parse(input);
  const image = parsed.image || await ensureCategoryArt(parsed.slug, parsed.name);
  try {
    if (!id) return await prisma.category.create({ data: { ...parsed, image } });
    return await prisma.category.update({ where: { id }, data: { ...parsed, image } });
  } catch (error) {
    if (isUniqueConstraint(error)) {
      const failure = new Error("That category slug is already used.");
      (failure as Error & { status?: number }).status = 400;
      throw failure;
    }
    throw error;
  }
}
