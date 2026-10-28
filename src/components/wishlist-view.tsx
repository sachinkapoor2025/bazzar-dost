"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/product-card";
import { Price } from "@/components/price";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { buttonClass } from "@/components/ui";
import { MAX_LINE_QTY } from "@/lib/commerce";
import type { ProductCardData } from "@/lib/types";

export function WishlistView() {
  const wishlist = useWishlist();
  const cart = useCart();
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
      ) : (
        <ul className="grid gap-3">
          {products.map((product) => (
            <li key={product.id} className="grid grid-cols-[5rem_1fr] gap-3 rounded-2xl border border-cream-300 bg-white p-3">
              <Link href={`/products/${product.slug}`} className="block aspect-square overflow-hidden rounded-xl bg-cream-100">
                <ProductImage src={product.image} alt={product.imageAlt} />
              </Link>
              <div>
                <Link href={`/products/${product.slug}`} className="font-semibold">{product.name}</Link>
                <div className="mt-1"><Price price={product.price} compareAt={product.compareAtPrice} from={product.fromPrice} /></div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.hasVariants || !product.inStock ? (
                    <Link href={`/products/${product.slug}`} className={buttonClass("primary")}>{product.inStock ? "Choose options" : "Out of stock"}</Link>
                  ) : (
                    <button
                      type="button"
                      className={buttonClass("primary")}
                      onClick={() => cart.add({
                        productId: product.id,
                        variantId: null,
                        slug: product.slug,
                        name: product.name,
                        variantName: null,
                        unitPrice: product.price,
                        image: product.image,
                        sku: product.sku,
                        maxQty: Math.min(product.stock, MAX_LINE_QTY),
                        qty: 1,
                      })}
                    >
                      Move to cart
                    </button>
                  )}
                  <button type="button" className={buttonClass("outline")} onClick={() => wishlist.toggle(product.id)}>Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
