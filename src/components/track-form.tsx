"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";
import { formatDate, formatINR } from "@/lib/format";

type Tracked = {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  total: number;
  trackingNote: string;
  items: Array<{ name: string; qty: number }>;
};

export function TrackForm() {
  const [order, setOrder] = useState<Tracked | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setOrder(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber: form.get("orderNumber"), email: form.get("email") }),
    });
    const data = (await response.json()) as { error?: string; order?: Tracked };
    if (!response.ok || !data.order) setError(data.error || "No order matches those details.");
    else setOrder(data.order);
    setPending(false);
  }

  return (
    <div className="grid max-w-xl gap-4">
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className={labelClass}>Order number<input name="orderNumber" required className={fieldClass} placeholder="BD-…" /></label>
        <label className={labelClass}>Email used at checkout<input name="email" type="email" required className={fieldClass} /></label>
        <button className={buttonClass("primary")} disabled={pending}>{pending ? "Looking up…" : "Track order"}</button>
      </form>
      {error ? <p role="alert" className="text-sm text-[#7F1D1D]">{error}</p> : null}
      {order ? (
        <article className="rounded-2xl border border-cream-300 bg-white p-4 text-sm">
          <h2 className="font-display text-2xl">{order.orderNumber}</h2>
          <p className="mt-1 capitalize">{order.status} · Payment {order.paymentStatus}</p>
          <p className="text-muted">Placed {formatDate(order.createdAt)} · {formatINR(order.total)}</p>
          <p className="mt-2">{order.trackingNote || "No courier note has been added yet."}</p>
          <ul className="mt-3 list-disc pl-5">
            {order.items.map((item) => <li key={`${item.name}-${item.qty}`}>{item.name} × {item.qty}</li>)}
          </ul>
        </article>
      ) : null}
    </div>
  );
}
