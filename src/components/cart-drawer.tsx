"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { Money } from "@/components/money";
import { buttonClass } from "@/components/ui";
import { unoptimizedImage } from "@/lib/format";
import { usePreferences } from "@/components/preferences-provider";
import { formatINR } from "@/lib/format";

export function CartDrawer() {
  const cart = useCart();
  const { currency } = usePreferences();
  if (!cart.drawerOpen) return null;
  const subtotal = cart.lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-forest-950/40" role="presentation" onClick={() => cart.setDrawerOpen(false)}>
      <aside role="dialog" aria-label="Cart" className="flex h-full w-[min(100%,24rem)] flex-col bg-cream-50 p-4 text-ink shadow-card" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-3xl text-forest-900">Cart</h2>
          <button type="button" className={buttonClass("ghost")} onClick={() => cart.setDrawerOpen(false)}>Close</button>
        </div>
        {cart.lines.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Your cart is empty. Prices are checked again at checkout.</p>
        ) : (
          <ul className="mt-4 flex-1 space-y-3 overflow-y-auto">
            {cart.lines.map((line) => (
              <li key={line.key} className="grid grid-cols-[4rem_1fr] gap-3 rounded-2xl border border-cream-300 bg-white p-2">
                <Link href={`/products/${line.slug}`} className="block aspect-square overflow-hidden rounded-xl bg-cream-100" onClick={() => cart.setDrawerOpen(false)}>
                  {line.image ? <Image src={line.image} alt="" width={96} height={96} unoptimized={unoptimizedImage(line.image)} className="h-full w-full object-cover" /> : null}
                </Link>
                <div>
                  <Link href={`/products/${line.slug}`} className="text-sm font-semibold leading-5" onClick={() => cart.setDrawerOpen(false)}>{line.name}</Link>
                  <p className="text-sm"><Money amount={line.unitPrice} /></p>
                  <div className="mt-1 flex items-center gap-2">
                    <label className="sr-only" htmlFor={`drawer-qty-${line.key}`}>Quantity</label>
                    <input id={`drawer-qty-${line.key}`} type="number" min={1} max={line.maxQty} value={line.qty} className="h-10 w-16 rounded-xl border border-cream-300 px-2 text-sm" onChange={(event) => cart.setQty(line.key, Number(event.target.value))} />
                    <button type="button" className="text-sm font-semibold text-[#7F1D1D]" onClick={() => cart.remove(line.key)}>Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-cream-300 pt-3">
          <p className="flex justify-between text-sm font-semibold"><span>Subtotal</span><span><Money amount={subtotal} /></span></p>
          {currency === "INR" ? null : <p className="mt-1 text-xs text-muted">Checkout charges {formatINR(subtotal)} before shipping.</p>}
          <div className="mt-3 grid gap-2">
            <Link href="/cart" className={buttonClass("outline")} onClick={() => cart.setDrawerOpen(false)}>View cart</Link>
            <Link href="/checkout" className={`${buttonClass("primary")} ${cart.lines.length === 0 ? "pointer-events-none opacity-50" : ""}`} onClick={() => cart.setDrawerOpen(false)}>Checkout</Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
