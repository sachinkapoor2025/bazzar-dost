"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";
import { slugify } from "@/lib/format";

type Category = { id: string; name: string; slug: string; description: string; image: string; sortOrder: number };

function CategoryImageField({ initial }: { initial: string }) {
  const [image, setImage] = useState(initial);
  const [error, setError] = useState("");
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.set("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      setError(data.error || "Upload failed.");
      return;
    }
    setError("");
    setImage(data.url);
  }
  return (
    <div className="grid gap-2 md:col-span-4">
      <input type="hidden" name="image" value={image} />
      {image ? <p className="truncate text-sm text-muted">{image}</p> : <p className="text-sm text-muted">No image yet. Saving without one creates a catalogue image.</p>}
      <label className={labelClass}>Category image
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} className="block text-sm" />
      </label>
      {error ? <p className="text-sm">{error}</p> : null}
    </div>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [message, setMessage] = useState("");
  async function save(event: React.FormEvent<HTMLFormElement>, id?: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(id ? `/api/admin/categories/${id}` : "/api/admin/categories", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        slug: slugify(String(form.get("slug") || form.get("name") || "")),
        description: form.get("description") || "",
        image: String(form.get("image") || ""),
        sortOrder: Number(form.get("sortOrder") || 0),
      }),
    });
    const data = (await response.json()) as { error?: string };
    setMessage(data.error || "Saved.");
    if (response.ok) window.location.reload();
  }
  return (
    <div className="grid gap-4">
      {categories.map((category) => (
        <form key={category.id} onSubmit={(event) => save(event, category.id)} className="grid gap-2 rounded-2xl border border-cream-300 bg-white p-3 md:grid-cols-4">
          <input name="name" defaultValue={category.name} className={fieldClass} aria-label="Name" />
          <input name="slug" defaultValue={category.slug} className={fieldClass} aria-label="Slug" />
          <input name="sortOrder" type="number" defaultValue={category.sortOrder} className={fieldClass} aria-label="Sort order" />
          <button className={buttonClass("outline")}>Update</button>
          <input name="description" defaultValue={category.description} className={`${fieldClass} md:col-span-4`} aria-label="Description" />
          <CategoryImageField initial={category.image} />
        </form>
      ))}
      <form onSubmit={(event) => save(event)} className="grid max-w-xl gap-2">
        <h2 className="font-display text-2xl">Add a category</h2>
        <label className={labelClass}>Name<input name="name" required className={fieldClass} /></label>
        <label className={labelClass}>Slug<input name="slug" required className={fieldClass} /></label>
        <label className={labelClass}>Description<input name="description" className={fieldClass} /></label>
        <label className={labelClass}>Sort order<input name="sortOrder" type="number" defaultValue={categories.length + 1} className={fieldClass} /></label>
        <CategoryImageField initial="" />
        <button className={buttonClass("primary")}>Add category</button>
      </form>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}

export function OrderStatusForm({ id, status, paymentStatus, trackingNote }: { id: string; status: string; paymentStatus: string; trackingNote: string }) {
  const [message, setMessage] = useState("");
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: form.get("status"), paymentStatus: form.get("paymentStatus"), trackingNote: form.get("trackingNote") }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setMessage(data.message || data.error || "Could not update.");
    if (response.ok) window.location.reload();
  }
  return (
    <form onSubmit={onSubmit} className="mt-4 grid max-w-lg gap-3 rounded-2xl border border-cream-300 bg-white p-4">
      <p className="text-sm text-muted">Mark payment as paid only after the money has actually been collected. Cancelling returns stock once.</p>
      <label className={labelClass}>Status
        <select name="status" defaultValue={status} className={fieldClass}>{["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((item) => <option key={item}>{item}</option>)}</select>
      </label>
      <label className={labelClass}>Payment status
        <select name="paymentStatus" defaultValue={paymentStatus} className={fieldClass}>{["unpaid", "paid", "refunded"].map((item) => <option key={item}>{item}</option>)}</select>
      </label>
      <label className={labelClass}>Tracking note<input name="trackingNote" defaultValue={trackingNote} className={fieldClass} /></label>
      <button className={buttonClass("primary")}>Update order</button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}

export function InquiryList({ items }: { items: Array<{ id: string; type: string; name: string; email: string; phone: string; business: string; city: string; subject: string; message: string; productInterest: string; quantity: string; status: string; createdAt: string }> }) {
  async function update(id: string, status: string) {
    await fetch(`/api/admin/inquiries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    window.location.reload();
  }
  if (items.length === 0) return <p>No messages yet.</p>;
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-cream-300 bg-white p-3 text-sm">
          <p className="font-semibold capitalize">{item.type} · {item.status}</p>
          <p>{item.name} {item.business ? `· ${item.business}` : ""} · {item.email} {item.phone ? `· ${item.phone}` : ""}</p>
          {item.subject ? <p>{item.subject}</p> : null}
          {item.productInterest ? <p>Products: {item.productInterest} · Qty {item.quantity} · {item.city}</p> : null}
          <p className="mt-1 whitespace-pre-wrap">{item.message}</p>
          <label className="mt-2 block">Status
            <select defaultValue={item.status} className={`${fieldClass} mt-1 max-w-xs`} onChange={(event) => update(item.id, event.target.value)}>
              <option value="new">new</option>
              <option value="in_review">in review</option>
              <option value="closed">closed</option>
            </select>
          </label>
        </li>
      ))}
    </ul>
  );
}
