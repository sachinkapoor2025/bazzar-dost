"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/product-card";
import { Price } from "@/components/price";
import { useCompare } from "@/components/compare-provider";
import { buttonClass } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { usePreferences } from "@/components/preferences-provider";
import type { ProductCardData } from "@/lib/types";

export function CompareView() {
  const compare = useCompare();
  const { currency } = usePreferences();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!compare.ready) return;
    if (compare.ids.length === 0) {
      setProducts([]);
      return;
    }
    fetch(`/api/catalog?ids=${encodeURIComponent(compare.ids.join(","))}`)
      .then((response) => response.json())
      .then((data: { products?: ProductCardData[]; error?: string }) => {
        if (data.error) setError(data.error);
        const byId = new Map((data.products || []).map((product) => [product.id, product]));
        setProducts(compare.ids.map((id) => byId.get(id)).filter((product): product is ProductCardData => Boolean(product)));
      })
      .catch(() => setError("The comparison could not be loaded."));
  }, [compare.ids, compare.ready]);

  if (!compare.ready || products === null) return <p>Loading comparison…</p>;
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cream-300 bg-white p-8">
        <h2 className="font-display text-2xl">Nothing to compare yet</h2>
        <p className="mt-2 text-sm text-muted">Choose up to 3 products from the shop. Customer reviews stay on the homepage.</p>
        <Link href="/shop" className={`${buttonClass("primary")} mt-4`}>Browse products</Link>
      </div>
    );
  }

  const rows: Array<[string, (product: ProductCardData) => string]> = [
    ["Listed price", (product) => product.compareAtPrice && !product.fromPrice ? formatMoney(product.compareAtPrice, currency) : "No higher compare-at price"],
    ["Availability", (product) => product.inStock ? `${product.stock} in stock` : "Out of stock"],
    ["SKU", (product) => product.sku],
    ["Category", (product) => product.categoryName],
    ["Options", (product) => product.hasVariants ? product.variants.map((variant) => variant.name).join(", ") : "One option"],
  ];

  return (
    <div>
      {error ? <p role="alert" className="mb-3 text-sm text-[#7F1D1D]">{error}</p> : null}
      {compare.notice ? <p role="status" className="mb-3 text-sm">{compare.notice}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-separate border-spacing-2 text-left text-sm">
          <thead>
            <tr>
              <th className="w-32" />
              {products.map((product) => (
                <th key={product.id} className="min-w-48 rounded-2xl bg-white p-3 align-top font-normal">
                  <Link href={`/products/${product.slug}`} className="block aspect-square overflow-hidden rounded-xl bg-cream-100">
                    <ProductImage src={product.image} alt={product.imageAlt} />
                  </Link>
                  <Link href={`/products/${product.slug}`} className="mt-2 block font-display text-xl leading-tight">{product.name}</Link>
                  <button type="button" className="mt-2 text-sm font-semibold text-forest-800 underline" onClick={() => compare.remove(product.id)}>Remove</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="py-2 pr-2 font-semibold">Selling price</th>
              {products.map((product) => (
                <td key={product.id} className="rounded-xl bg-white px-3 py-2"><Price price={product.price} compareAt={product.compareAtPrice} from={product.fromPrice} /></td>
              ))}
            </tr>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th className="py-2 pr-2 font-semibold">{label}</th>
                {products.map((product) => (
                  <td key={product.id} className="rounded-xl bg-white px-3 py-2">{value(product)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th className="py-2 pr-2 font-semibold">Summary</th>
              {products.map((product) => (
                <td key={product.id} className="rounded-xl bg-white px-3 py-2 text-muted">{product.shortDescription || "No short description is stored."}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <button type="button" className={`${buttonClass("outline")} mt-4`} onClick={() => compare.clear()}>Clear comparison</button>
    </div>
  );
}
