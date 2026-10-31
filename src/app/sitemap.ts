import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({
      where: {
        OR: [
          { products: { some: { isActive: true } } },
          { children: { some: { products: { some: { isActive: true } } } } },
        ],
      },
      select: { slug: true },
    }),
  ]);
  const staticPaths = ["", "/shop", "/categories", "/catalogue", "/new-arrivals", "/best-sellers", "/deals", "/wholesale", "/about", "/contact", "/faq", "/shipping-policy", "/returns", "/privacy", "/terms", "/track"];
  return [
    ...staticPaths.map((path) => ({ url: absoluteUrl(path || "/"), changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.6 })),
    ...categories.map((category) => ({ url: absoluteUrl(`/categories/${category.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((product) => ({ url: absoluteUrl(`/products/${product.slug}`), lastModified: product.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
