import "server-only";
import fs from "node:fs";
import path from "node:path";
import { ApiError, api } from "@/lib/backend";
import { productSvg, categorySvg } from "@/lib/art";
import { productSchema, categorySchema } from "@/lib/validators";
import { s3Configured, uploadPublicObject } from "@/lib/storage";

function storageRequired(): void {
  if (process.env.NODE_ENV === "production" && !process.env.API_URL && !process.env.NEXT_PUBLIC_API_URL) {
    const error = new Error("Image storage is not configured.");
    (error as Error & { status?: number }).status = 500;
    throw error;
  }
}

export async function ensureProductArt(slug: string, name: string): Promise<string> {
  storageRequired();
  if (process.env.NODE_ENV === "production") {
    const uploaded = await api<{ url: string }>("/admin/upload", {
      body: { bodyBase64: Buffer.from(productSvg(name)).toString("base64"), extension: "svg", contentType: "image/svg+xml" },
    });
    return uploaded.url;
  }
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
  if (process.env.NODE_ENV === "production") {
    const uploaded = await api<{ url: string }>("/admin/upload", {
      body: { bodyBase64: Buffer.from(categorySvg(name)).toString("base64"), extension: "svg", contentType: "image/svg+xml" },
    });
    return uploaded.url;
  }
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
    return await api<{ id: string }>(id ? `/admin/products/${id}` : "/admin/products", {
      method: id ? "PATCH" : "POST",
      body: {
        ...data,
        images,
        variants: parsed.variants.map((variant) => ({ name: variant.name, sku: variant.sku, price: variant.price ?? null, stock: variant.stock })),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      const failure = new Error(error.message);
      (failure as Error & { status?: number }).status = error.status;
      throw failure;
    }
    throw error;
  }
}

export async function saveCategory(input: unknown, id?: string) {
  const parsed = categorySchema.parse(input);
  const image = parsed.image || await ensureCategoryArt(parsed.slug, parsed.name);
  try {
    return await api<{ id: string }>(id ? `/admin/categories/${id}` : "/admin/categories", {
      method: id ? "PATCH" : "POST",
      body: { ...parsed, image },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      const failure = new Error(error.message);
      (failure as Error & { status?: number }).status = error.status;
      throw failure;
    }
    throw error;
  }
}
