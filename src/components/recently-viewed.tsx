"use client";

import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/product-card";
import type { ProductCardData } from "@/lib/types";

const KEY = "bazaardost.viewed.v1";

export function RecordView({ slug }: { slug: string }) {
  useEffect(() => {
    const hits = new Set((sessionStorage.getItem("bazaardost.view-hits") || "").split(",").filter(Boolean));
    if (!hits.has(slug)) {
      hits.add(slug);
      sessionStorage.setItem("bazaardost.view-hits", [...hits].join(","));
      fetch(`/api/products/${slug}/view`, { method: "POST" }).catch(() => undefined);
    }
    const current = JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
    const next = [slug, ...current.filter((item) => item !== slug)].slice(0, 12);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, [slug]);
  return null;
}

export function RecentlyViewed({ exclude }: { exclude?: string }) {
  const [products, setProducts] = useState<ProductCardData[] | null>(null);

  useEffect(() => {
    const slugs = (JSON.parse(localStorage.getItem(KEY) || "[]") as string[]).filter((slug) => slug !== exclude).slice(0, 8);
    if (slugs.length === 0) {
      setProducts([]);
      return;
    }
    fetch(`/api/catalog?slugs=${encodeURIComponent(slugs.join(","))}`)
      .then((response) => response.json())
      .then((data: { products?: ProductCardData[] }) => setProducts(data.products || []))
      .catch(() => setProducts([]));
  }, [exclude]);

  if (!products || products.length === 0) return null;
  return (
    <section aria-labelledby="recent-heading" className="pb-6">
      <h2 id="recent-heading" className="mb-4 font-display text-3xl text-forest-900">Recently viewed</h2>
      <ProductGrid products={products} />
    </section>
  );
}
