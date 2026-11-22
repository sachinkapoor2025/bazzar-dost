"use client";

import { useMemo, useState } from "react";
import { fieldClass } from "@/components/ui";

type CartRow = {
  id: string;
  status: string;
  createdAt: string;
  payload: { email?: string; name?: string; phone?: string; items?: Array<{ name?: string; qty?: number }> };
};

export function CartBoard({ rows }: { rows: CartRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status && row.status !== status) return false;
      if (!needle) return true;
      const items = (row.payload.items || []).map((item) => item.name).join(" ");
      return [row.payload.email, row.payload.name, row.payload.phone, items].some((value) => String(value || "").toLowerCase().includes(needle));
    });
  }, [query, rows, status]);

  async function update(id: string, next: string) {
    if (!window.confirm("Update this cart?")) return;
    setError("");
    const response = await fetch(`/api/admin/records/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) {
      setError(data.error || "Could not update the cart.");
      return;
    }
    setMessage(data.message || "Updated.");
    window.location.reload();
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search email or product" className={`${fieldClass} max-w-sm`} aria-label="Search carts" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className={`${fieldClass} max-w-[12rem]`} aria-label="Cart status">
          <option value="">All statuses</option>
          <option value="open">open</option>
          <option value="recovered">recovered</option>
          <option value="ordered">ordered</option>
        </select>
      </div>
      {visible.length === 0 ? <p className="text-sm text-muted">No checkout carts are stored yet. A cart is saved when a customer types an email at checkout and still has items.</p> : (
        <ul className="grid gap-3">
          {visible.map((row) => (
            <li key={row.id} className="rounded-2xl border border-cream-300 bg-white p-3 text-sm">
              <p className="font-semibold">{row.payload.email} · {row.status}</p>
              <p>{row.payload.name} {row.payload.phone ? `· ${row.payload.phone}` : ""}</p>
              <p className="mt-1">{(row.payload.items || []).map((item) => `${item.name} × ${item.qty}`).join(", ")}</p>
              <p className="mt-1 text-xs text-muted">{new Date(row.createdAt).toLocaleString("en-IN")}</p>
              <label className="mt-2 block text-sm font-semibold">Status
                <select defaultValue={row.status} className={`${fieldClass} mt-1 max-w-xs`} onChange={(event) => void update(row.id, event.target.value)}>
                  <option value="open">open</option>
                  <option value="recovered">recovered</option>
                  <option value="ordered">ordered</option>
                </select>
              </label>
            </li>
          ))}
        </ul>
      )}
      {error ? <p className="text-sm text-[#7F1D1D]" role="alert">{error}</p> : null}
      {message ? <p className="text-sm" role="status">{message}</p> : null}
    </div>
  );
}
