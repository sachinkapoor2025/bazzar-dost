"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { buttonClass } from "@/components/ui";
import { shippingCharge } from "@/lib/commerce";
import { formatINR } from "@/lib/format";
import type { CartLine } from "@/lib/types";

type QuoteLine = CartLine & { available: boolean; message?: string };

export function CartView() {
  const cart = useCart();
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cart.ready) return;
    if (cart.lines.length === 0) {
      setLines([]);
      return;
    }
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.lines.map((line) => ({ productId: line.productId, variantId: line.variantId, qty: line.qty })) }),
    })
      .then((response) => response.json())
      .then((data: { lines?: QuoteLine[]; error?: string }) => {
        if (data.error) setError(data.error);
        setLines(data.lines || []);
      })
      .catch(() => setError("Prices could not be refreshed. Try again."));
  }, [cart.lines, cart.ready]);

  const payable = lines.filter((line) => line.available);
  const subtotal = payable.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);

  if (!cart.ready) return <p>Loading your cart…</p>;
  if (cart.lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-cream-300 bg-white p-8">
        <h2 className="font-display text-2xl">Your cart is empty</h2>
        <Link href="/shop" className={`${buttonClass("primary")} mt-4`}>Browse products</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <ul className="space-y-3">
        {lines.map((line) => (
          <li key={line.key} className="grid grid-cols-[5rem_1fr] gap-3 rounded-2xl border border-cream-300 bg-white p-3">
            <Link href={`/products/${line.slug}`} className="block aspect-square overflow-hidden rounded-xl bg-cream-100">
              {line.image ? <Image src={line.image} alt="" width={160} height={160} unoptimized={line.image.endsWith(".svg")} className="h-full w-full object-cover" /> : null}
            </Link>
            <div>
              <Link href={`/products/${line.slug}`} className="font-semibold">{line.name}{line.variantName ? ` — ${line.variantName}` : ""}</Link>
              <p className="text-sm text-muted">SKU {line.sku}</p>
              <p className="text-sm">{formatINR(line.unitPrice)}</p>
              {line.message ? <p className="text-sm text-[#7F1D1D]">{line.message}</p> : null}
              <div className="mt-2 flex items-center gap-2">
                <label className="sr-only" htmlFor={`qty-${line.key}`}>Quantity</label>
                <input id={`qty-${line.key}`} type="number" min={1} max={line.maxQty} value={line.qty} className="h-11 w-20 rounded-xl border border-cream-300 px-2" onChange={(event) => cart.setQty(line.key, Number(event.target.value))} />
                <button type="button" className={buttonClass("danger")} onClick={() => cart.remove(line.key)}>Remove</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-2xl border border-cream-300 bg-white p-4">
        <h2 className="font-display text-2xl">Summary</h2>
        <p className="mt-3 flex justify-between text-sm"><span>Subtotal</span><span>{formatINR(subtotal)}</span></p>
        <p className="mt-1 text-xs leading-5 text-muted">Shipping is {formatINR(shippingCharge(subtotal))} at this subtotal. Coupons are applied at checkout. Prices include applicable taxes, and no extra tax line is added.</p>
        {error ? <p role="alert" className="mt-2 text-sm text-[#7F1D1D]">{error}</p> : null}
        <Link href="/checkout" className={`${buttonClass("primary", "mt-4 w-full")} ${payable.length === 0 ? "pointer-events-none opacity-50" : ""}`} aria-disabled={payable.length === 0}>Checkout</Link>
      </aside>
    </div>
  );
}
