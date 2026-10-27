"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";

export function PromotionManager({ items }: { items: Array<{ id: string; title: string; message: string; href: string; kind: string; active: boolean }> }) {
  const [note, setNote] = useState("");
  async function send(event: React.FormEvent<HTMLFormElement>, id?: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(id ? `/api/admin/promotions/${id}` : "/api/admin/promotions", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        message: form.get("message"),
        href: form.get("href") || "",
        kind: form.get("kind"),
        active: form.get("active") === "on",
      }),
    });
    const data = (await response.json()) as { error?: string };
    setNote(data.error || "Saved.");
    if (response.ok) window.location.reload();
  }
  return (
    <div className="grid gap-4">
      {items.map((item) => (
        <form key={item.id} onSubmit={(event) => send(event, item.id)} className="grid gap-2 rounded-2xl border border-cream-300 bg-white p-3">
          <input name="title" defaultValue={item.title} className={fieldClass} aria-label="Title" />
          <input name="message" defaultValue={item.message} className={fieldClass} aria-label="Message" />
          <input name="href" defaultValue={item.href} className={fieldClass} aria-label="Link" />
          <select name="kind" defaultValue={item.kind} className={fieldClass}><option value="announcement">announcement</option><option value="banner">banner</option></select>
          <label className="text-sm"><input type="checkbox" name="active" defaultChecked={item.active} /> Active</label>
          <button className={buttonClass("outline")}>Update</button>
        </form>
      ))}
      <form onSubmit={(event) => send(event)} className="grid max-w-xl gap-2">
        <h2 className="font-display text-2xl">New announcement</h2>
        <label className={labelClass}>Title<input name="title" required className={fieldClass} /></label>
        <label className={labelClass}>Message<input name="message" required className={fieldClass} /></label>
        <label className={labelClass}>Link<input name="href" placeholder="/shipping-policy" className={fieldClass} /></label>
        <input type="hidden" name="kind" value="announcement" />
        <label className="text-sm"><input type="checkbox" name="active" defaultChecked /> Active</label>
        <button className={buttonClass("primary")}>Add</button>
      </form>
      {note ? <p className="text-sm">{note}</p> : null}
    </div>
  );
}

export function CouponManager() {
  const [note, setNote] = useState("");
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.get("code"),
        type: form.get("type"),
        value: Number(form.get("value")),
        minSubtotal: Number(form.get("minSubtotal") || 0),
        active: true,
        note: form.get("note") || "",
        expiresAt: "",
      }),
    });
    const data = (await response.json()) as { error?: string };
    setNote(data.error || "Coupon saved.");
    if (response.ok) window.location.reload();
  }
  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-2">
      <label className={labelClass}>Code<input name="code" required className={fieldClass} /></label>
      <label className={labelClass}>Type
        <select name="type" className={fieldClass}><option value="FIXED">Fixed rupees</option><option value="PERCENT">Percent</option></select>
      </label>
      <label className={labelClass}>Value<input name="value" type="number" min={1} required className={fieldClass} /></label>
      <label className={labelClass}>Minimum subtotal<input name="minSubtotal" type="number" min={0} defaultValue={0} className={fieldClass} /></label>
      <label className={labelClass}>Note<input name="note" className={fieldClass} /></label>
      <button className={buttonClass("primary")}>Add coupon</button>
      {note ? <p className="text-sm">{note}</p> : null}
    </form>
  );
}
