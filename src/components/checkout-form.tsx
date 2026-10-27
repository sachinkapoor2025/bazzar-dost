"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";
import { couponDiscount, orderTotal, shippingCharge } from "@/lib/commerce";
import { formatINR } from "@/lib/format";
import { INDIAN_STATES } from "@/lib/states";
import type { CartLine, PublicUser } from "@/lib/types";

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

type QuoteLine = CartLine & { available: boolean; message?: string };

export function CheckoutForm({
  mode,
  user,
  addresses,
}: {
  mode: "cart" | "now";
  user: PublicUser | null;
  addresses: Address[];
}) {
  const cart = useCart();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ type: string; value: number; minSubtotal: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [priced, setPriced] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    line1: "",
    line2: "",
    city: "",
    state: "Delhi",
    pincode: "",
    notes: "",
  });

  useEffect(() => {
    const source = mode === "now" ? readBuyNow() : cart.ready ? cart.lines : null;
    if (!source) return;
    if (source.length === 0) {
      setLines([]);
      setPriced(true);
      return;
    }
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: source.map((line) => ({ productId: line.productId, variantId: line.variantId, qty: line.qty })) }),
    })
      .then((response) => response.json())
      .then((data: { lines?: QuoteLine[] }) => setLines(data.lines || []))
      .catch(() => setError("The cart could not be priced. Try again."))
      .finally(() => setPriced(true));
  }, [cart.lines, cart.ready, mode]);

  const payable = lines.filter((line) => line.available);
  const subtotal = payable.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  const discount = couponDiscount(subtotal, coupon);
  const shipping = shippingCharge(Math.max(0, subtotal - discount));
  const total = orderTotal(subtotal, discount, shipping);

  function applyAddress(address: Address) {
    setForm((current) => ({
      ...current,
      name: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    }));
  }

  async function applyCoupon() {
    setCoupon(null);
    setCouponMessage("");
    if (!couponCode.trim()) return;
    const response = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, subtotal }),
    });
    const data = (await response.json()) as { error?: string; type?: string; value?: number; minSubtotal?: number };
    if (!response.ok || !data.type || data.value == null || data.minSubtotal == null) {
      setCouponMessage(data.error || "That coupon is not valid.");
      return;
    }
    setCoupon({ type: data.type, value: data.value, minSubtotal: data.minSubtotal });
    setCouponMessage("Coupon applied. The final amount is confirmed when the order is created.");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || payable.length === 0) return;
    setPending(true);
    setError("");
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey,
        ...form,
        couponCode,
        items: payable.map((line) => ({ productId: line.productId, variantId: line.variantId, qty: line.qty })),
      }),
    });
    const data = (await response.json()) as { error?: string; orderNumber?: string; accessToken?: string };
    if (!response.ok || !data.orderNumber || !data.accessToken) {
      setError(data.error || "The order was not created.");
      setPending(false);
      return;
    }
    if (mode === "now") {
      sessionStorage.removeItem("bazaardost.buynow");
      for (const line of payable) cart.remove(line.key);
    } else {
      cart.clear();
    }
    window.location.href = `/orders/${data.orderNumber}?token=${data.accessToken}`;
  }

  if (!priced && lines.length === 0) return <p>Checking prices…</p>;
  if (priced && payable.length === 0 && lines.length === 0) {
    return <p>There is nothing to check out. <Link href="/cart" className="underline">Return to the cart</Link></p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid gap-3">
        {addresses.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {addresses.map((address) => (
              <button type="button" key={address.id} className={buttonClass("outline")} onClick={() => applyAddress(address)}>{address.label}</button>
            ))}
          </div>
        ) : null}
        <label className={labelClass}>Full name<input className={fieldClass} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label className={labelClass}>Email<input type="email" className={fieldClass} required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label className={labelClass}>Mobile<input className={fieldClass} required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
        <label className={labelClass}>Address<input className={fieldClass} required value={form.line1} onChange={(event) => setForm({ ...form, line1: event.target.value })} /></label>
        <label className={labelClass}>Address line 2<input className={fieldClass} value={form.line2} onChange={(event) => setForm({ ...form, line2: event.target.value })} /></label>
        <label className={labelClass}>City<input className={fieldClass} required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
        <label className={labelClass}>State
          <select className={fieldClass} value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })}>
            {INDIAN_STATES.map((state) => <option key={state}>{state}</option>)}
          </select>
        </label>
        <label className={labelClass}>PIN code<input className={fieldClass} required value={form.pincode} onChange={(event) => setForm({ ...form, pincode: event.target.value })} /></label>
        <label className={labelClass}>Notes<input className={fieldClass} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        <fieldset className="rounded-2xl border border-cream-300 p-3">
          <legend className="px-1 text-sm font-semibold">Payment</legend>
          <label className="flex gap-2 text-sm leading-6">
            <input type="radio" name="payment" value="cod" checked readOnly />
            Cash on delivery. The order is created as unpaid. Payment is collected on delivery and is not marked paid automatically.
          </label>
        </fieldset>
      </div>
      <aside className="h-fit rounded-2xl border border-cream-300 bg-white p-4">
        <h2 className="font-display text-2xl">Order total</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {lines.map((line) => (
            <li key={line.key}>
              {line.name}{line.variantName ? ` — ${line.variantName}` : ""} × {line.qty}
              <span className="float-right">{line.available ? formatINR(line.unitPrice * line.qty) : "Unavailable"}</span>
              {line.message ? <span className="block text-[#7F1D1D]">{line.message}</span> : null}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <label className="sr-only" htmlFor="coupon">Coupon</label>
          <input id="coupon" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Coupon code" className={fieldClass} />
          <button type="button" className={buttonClass("outline")} onClick={applyCoupon}>Apply</button>
        </div>
        {couponMessage ? <p className="mt-2 text-xs">{couponMessage}</p> : null}
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Discount</dt><dd>{formatINR(discount)}</dd></div>
          <div className="flex justify-between"><dt>Shipping</dt><dd>{formatINR(shipping)}</dd></div>
          <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatINR(total)}</dd></div>
        </dl>
        <p className="mt-2 text-xs leading-5 text-muted">No card details are requested. Submitting once creates the order and reserves the stock that is available.</p>
        {error ? <p role="alert" className="mt-2 text-sm text-[#7F1D1D]">{error}</p> : null}
        <button className={`${buttonClass("primary")} mt-4 w-full`} disabled={pending || payable.length === 0}>{pending ? "Placing order…" : "Place order"}</button>
      </aside>
    </form>
  );
}

function readBuyNow(): CartLine[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem("bazaardost.buynow") || "[]") as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
