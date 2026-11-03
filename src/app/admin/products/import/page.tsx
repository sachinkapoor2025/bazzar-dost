"use client";

import { useState, type FormEvent } from "react";

export default function ImportProductsPage() {
  const [csv, setCsv] = useState("sku,price,stock,active\n");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      setMessage(data.message || data.error || "Import failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl">
      <h1 className="font-display text-4xl">CSV stock and price update</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Use columns sku, price, stock, and active. Only products that already exist are updated, so the catalogue is not filled with incomplete rows. New products are added from the product form, which also stores the description, category, and images.</p>
      <textarea value={csv} onChange={(event) => setCsv(event.target.value)} rows={12} className="mt-4 w-full rounded-xl border border-cream-300 p-3 text-sm" />
      <button disabled={pending} className="mt-3 min-h-11 rounded-full bg-forest-800 px-4 text-sm font-semibold text-cream-50 disabled:opacity-50">Update products</button>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </form>
  );
}
