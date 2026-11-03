"use client";

import { useState } from "react";

export function StockEditor({ productId, variantId, stock }: { productId: string; variantId?: string; stock: number }) {
  const [value, setValue] = useState(String(stock));
  const [message, setMessage] = useState("");

  async function save() {
    const next = Number(value);
    const response = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variantId: variantId || null, stock: next }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    setMessage(data.message || data.error || "Could not save.");
  }

  return (
    <div className="flex items-center gap-2">
      <input value={value} onChange={(event) => setValue(event.target.value)} inputMode="numeric" aria-label="Stock" className="min-h-11 w-24 rounded-xl border border-cream-300 px-2 text-sm" />
      <button type="button" className="text-sm font-semibold underline" onClick={save}>Save</button>
      {message ? <span className="text-xs text-muted">{message}</span> : null}
    </div>
  );
}
