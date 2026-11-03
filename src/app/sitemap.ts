import type { MetadataRoute } from "next";
import { api } from "@/lib/backend";
import { localSitemap } from "@/lib/local-catalogue";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL
    ? await api<{ products: Array<{ slug: string; updatedAt: string }>; categories: Array<{ slug: string }> }>("/sitemap")
    : localSitemap();
  const staticPaths = ["", "/shop", "/categories", "/catalogue", "/new-arrivals", "/best-sellers", "/deals", "/wholesale", "/about", "/contact", "/faq", "/shipping-policy", "/returns", "/privacy", "/terms", "/track"];
  return [
    ...staticPaths.map((path) => ({ url: absoluteUrl(path || "/"), changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.6 })),
    ...data.categories.map((category) => ({ url: absoluteUrl(`/categories/${category.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...data.products.map((product) => ({ url: absoluteUrl(`/products/${product.slug}`), lastModified: product.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
