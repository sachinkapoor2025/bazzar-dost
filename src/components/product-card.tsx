"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useCompare } from "@/components/compare-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { Price } from "@/components/price";
import { buttonClass } from "@/components/ui";
import { MAX_LINE_QTY } from "@/lib/commerce";
import { unoptimizedImage } from "@/lib/format";
import { sizedImage } from "@/lib/images";
import type { ProductCardData } from "@/lib/types";

export function ProductImage({
  src,
  alt,
  eager = false,
  pixels = 400,
}: {
  src: string;
  alt: string;
  eager?: boolean;
  pixels?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className="grid h-full w-full place-items-center bg-cream-200 font-display text-forest-800">BD</span>;
  }
  const sized = sizedImage(src, pixels);
  return (
    <Image
      src={sized}
      alt={alt}
      width={pixels}
      height={pixels}
      priority={eager}
      sizes={pixels <= 160 ? "4rem" : "(max-width: 768px) 45vw, 240px"}
      unoptimized={unoptimizedImage(sized)}
      className="h-full w-full object-cover motion-safe:transition motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]"
      onError={() => setFailed(true)}
    />
  );
}

export function ProductCard({ product, eager = false }: { product: ProductCardData; eager?: boolean }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [quickOpen, setQuickOpen] = useState(false);
  const saved = wishlist.ids.includes(product.id);
  const compared = compare.ids.includes(product.id);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!quickOpen || !dialog || dialog.open) return;
    dialog.showModal();
  }, [quickOpen]);

  function addSimple() {
    cart.add({
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
    });
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-card">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-cream-100" onClick={() => trackProductClick(product.slug)}>
        <ProductImage src={product.image} alt={product.imageAlt} eager={eager} />
        {!product.inStock ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-ink/85 px-2 py-1 text-xs font-semibold text-white">Out of stock</span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">{product.categoryName}</p>
        <h3 className="line-clamp-3 font-display text-lg leading-tight sm:text-xl">
          <Link href={`/products/${product.slug}`} className="hover:text-forest-700" onClick={() => trackProductClick(product.slug)}>
            {product.name}
          </Link>
        </h3>
        <Price price={product.price} compareAt={product.compareAtPrice} from={product.fromPrice} />
        <div className="mt-auto flex items-center gap-2 pt-2">
          <button
            type="button"
            className={buttonClass("ghost", "min-h-11 min-w-11 px-0")}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            onClick={() => wishlist.toggle(product.id)}
          >
            <Heart filled={saved} />
          </button>
          {product.hasVariants ? (
            <Link href={`/products/${product.slug}`} className={buttonClass("primary", "flex-1 px-2 text-xs sm:px-4 sm:text-sm")} onClick={() => trackProductClick(product.slug)}>
              Choose options
            </Link>
          ) : (
            <button type="button" className={buttonClass("primary", "flex-1 px-2 text-xs sm:px-4 sm:text-sm")} disabled={!product.inStock} onClick={addSimple}>
              {product.inStock ? "Add to cart" : "Out of stock"}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-forest-700 sm:text-sm">
          <button type="button" className="underline-offset-2 hover:underline" aria-pressed={compared} onClick={() => compare.toggle(product.id)}>
            {compared ? "In compare" : "Compare"}
          </button>
          <button type="button" className="underline-offset-2 hover:underline" onClick={() => { trackProductClick(product.slug); setQuickOpen(true); }}>
            Quick view
          </button>
        </div>
      </div>
      {quickOpen ? (
      <dialog ref={dialogRef} aria-labelledby={titleId} className="max-h-[90dvh] w-[min(calc(100vw-1.5rem),40rem)] overflow-y-auto rounded-2xl border border-cream-300 bg-cream-50 p-0 text-ink backdrop:bg-forest-950/50" onClose={() => setQuickOpen(false)}>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-xl bg-cream-100">
            <ProductImage src={product.image} alt={product.imageAlt} pixels={640} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{product.categoryName}</p>
            <h3 id={titleId} className="mt-1 font-display text-3xl">{product.name}</h3>
            <div className="mt-2">
              <Price price={product.price} compareAt={product.compareAtPrice} from={product.fromPrice} />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{product.shortDescription}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.hasVariants || !product.inStock ? (
                <Link href={`/products/${product.slug}`} className={buttonClass("primary")} onClick={() => { trackProductClick(product.slug); dialogRef.current?.close(); }}>
                  View product
                </Link>
              ) : (
                <button type="button" className={buttonClass("primary")} onClick={addSimple}>Add to cart</button>
              )}
              <form method="dialog">
                <button className={buttonClass("outline")}>Close</button>
              </form>
            </div>
          </div>
        </div>
      </dialog>
      ) : null}
    </article>
  );
}

function trackProductClick(slug: string) {
  fetch(`/api/products/${encodeURIComponent(slug)}/click`, { method: "POST", keepalive: true }).catch(() => undefined);
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} eager={index < priorityCount} />
      ))}
    </div>
  );
}

export function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z"
        fill={filled ? "#E8B84A" : "none"}
        stroke="#1B4332"
        strokeWidth="1.8"
      />
    </svg>
  );
}
