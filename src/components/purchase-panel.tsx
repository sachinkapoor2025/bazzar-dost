"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { Price } from "@/components/price";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";
import { MAX_LINE_QTY, sellingPrice, showCompareAt } from "@/lib/commerce";
import type { VariantData } from "@/lib/types";

type PurchaseProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string;
  image: string;
  variants: VariantData[];
};

export function PurchasePanel({ product }: { product: PurchaseProduct }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const options = [...product.variants].sort(
    (a, b) => sellingPrice(product.price, a.price) - sellingPrice(product.price, b.price),
  );
  const initial = options.find((variant) => variant.stock > 0)?.id || options[0]?.id || "";
  const [variantId, setVariantId] = useState(initial);
  const [qty, setQty] = useState(1);
  const variant = product.variants.find((item) => item.id === variantId) || null;
  const unit = variant ? sellingPrice(product.price, variant.price) : product.price;
  const compare = showCompareAt(unit, product.price, product.compareAtPrice);
  const stock = variant ? variant.stock : product.stock;
  const sku = variant?.sku || product.sku;
  const saved = wishlist.ids.includes(product.id);
  const maxQty = Math.min(stock, MAX_LINE_QTY);

  const line = useMemo(
    () => ({
      productId: product.id,
      variantId: variant?.id || null,
      slug: product.slug,
      name: product.name,
      variantName: variant?.name || null,
      unitPrice: unit,
      image: variant?.image || product.image,
      sku,
      maxQty,
    }),
    [maxQty, product, sku, unit, variant],
  );

  return (
    <div className="rounded-3xl border border-cream-300 bg-white p-4">
      <Price price={unit} compareAt={compare} basePrice={unit} />
      <p className="mt-3 text-sm text-muted">SKU {sku}</p>
      <p className="mt-1 text-sm font-semibold">{stock > 0 ? `${stock} in stock` : "Out of stock"}</p>
      {product.variants.length > 0 ? (
        <fieldset className="mt-4">
          <legend className={labelClass}>Option</legend>
          <div className="flex flex-wrap gap-2">
            {options.map((item) => (
              <label key={item.id} className={`min-h-11 cursor-pointer rounded-full border px-3 py-2 text-sm ${item.id === variantId ? "border-forest-800 bg-forest-800 text-cream-50" : "border-cream-300"}`}>
                <input className="sr-only" type="radio" name="variant" value={item.id} checked={item.id === variantId} onChange={() => { setVariantId(item.id); setQty(1); }} />
                {item.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <div className="mt-4">
        <label className={labelClass} htmlFor="qty">Quantity</label>
        <input id="qty" className={`${fieldClass} max-w-28`} type="number" min={1} max={Math.max(1, maxQty)} value={qty} disabled={stock < 1} onChange={(event) => setQty(Math.min(Math.max(1, Number(event.target.value) || 1), Math.max(1, maxQty)))} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={buttonClass("primary")} disabled={stock < 1} onClick={() => cart.add({ ...line, qty })}>Add to cart</button>
        <button type="button" className={buttonClass("gold")} disabled={stock < 1} onClick={() => cart.buyNow({ ...line, qty })}>Buy now</button>
        <button type="button" className={buttonClass("outline")} aria-pressed={saved} onClick={() => wishlist.toggle(product.id)}>{saved ? "Saved" : "Wishlist"}</button>
      </div>
    </div>
  );
}
