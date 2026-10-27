"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductGrid } from "@/components/product-card";
import { useWishlist } from "@/components/wishlist-provider";
import { buttonClass } from "@/components/ui";
import type { ProductCardData } from "@/lib/types";

export function WishlistView() {
  const wishlist = useWishlist();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!wishlist.ready) return;
    if (wishlist.ids.length === 0) {
      setProducts([]);
      return;
    }
    fetch(`/api/catalog?ids=${encodeURIComponent(wishlist.ids.join(","))}`)
      .then((response) => response.json())
      .then((data: { products?: ProductCardData[]; error?: string }) => {
        if (data.error) setError(data.error);
        setProducts(data.products || []);
      })
      .catch(() => setError("The wishlist could not be loaded."));
  }, [wishlist.ids, wishlist.ready]);

  if (!wishlist.ready || products === null) return <p>Loading your wishlist…</p>;
  return (
    <div>
      <p className="mb-4 text-sm text-muted">{wishlist.user ? "Saved on your account." : "Saved in this browser. Sign in to keep it on your account."}</p>
      {error ? <p role="alert" className="mb-3 text-sm text-[#7F1D1D]">{error} <button className="underline" onClick={() => window.location.reload()}>Retry</button></p> : null}
      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-300 bg-white p-8">
          <h2 className="font-display text-2xl">Your wishlist is empty</h2>
          <Link href="/shop" className={`${buttonClass("primary")} mt-4`}>Browse products</Link>
        </div>
      ) : <ProductGrid products={products} />}
    </div>
  );
}
