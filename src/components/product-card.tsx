"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef } from "react";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";
import { Price } from "@/components/price";
import { buttonClass } from "@/components/ui";
import { MAX_LINE_QTY } from "@/lib/commerce";
import type { ProductCardData } from "@/lib/types";

export function ProductImage({
  src,
  alt,
  eager = false,
}: {
  src: string;
  alt: string;
  eager?: boolean;
}) {
  if (!src) {
    return <span className="grid h-full w-full place-items-center bg-cream-200 font-display text-forest-800">BD</span>;
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={800}
      priority={eager}
      unoptimized={src.endsWith(".svg")}
      className="h-full w-full object-cover motion-safe:transition motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]"
    />
  );
}

export function ProductCard({ product, eager = false }: { product: ProductCardData; eager?: boolean }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const saved = wishlist.ids.includes(product.id);

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
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-cream-100">
        <ProductImage src={product.image} alt={product.imageAlt} eager={eager} />
        {!product.inStock ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-ink/85 px-2 py-1 text-xs font-semibold text-white">Out of stock</span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">{product.categoryName}</p>
        <h3 className="font-display text-xl leading-tight">
          <Link href={`/products/${product.slug}`} className="hover:text-forest-700">
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
            <Link href={`/products/${product.slug}`} className={buttonClass("primary", "flex-1")}>
              Choose options
            </Link>
          ) : (
            <button type="button" className={buttonClass("primary", "flex-1")} disabled={!product.inStock} onClick={addSimple}>
              {product.inStock ? "Add to cart" : "Out of stock"}
            </button>
          )}
        </div>
        <button type="button" className="self-start text-sm font-semibold text-forest-700 underline-offset-2 hover:underline" onClick={() => dialogRef.current?.showModal()}>
          Quick view
        </button>
      </div>
      <dialog ref={dialogRef} aria-labelledby={titleId} className="w-[min(100%,40rem)] rounded-2xl border border-cream-300 bg-cream-50 p-0 text-ink backdrop:bg-forest-950/50">
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-xl bg-cream-100">
            <ProductImage src={product.image} alt={product.imageAlt} />
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
                <Link href={`/products/${product.slug}`} className={buttonClass("primary")} onClick={() => dialogRef.current?.close()}>
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
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} eager={index < 4} />
      ))}
    </div>
  );
}

function Heart({ filled }: { filled: boolean }) {
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
