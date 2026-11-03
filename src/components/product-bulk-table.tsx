"use client";

import Link from "next/link";
import { useState } from "react";
import { formatINR } from "@/lib/format";

type Row = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  active: boolean;
};

export function ProductBulkTable({ rows }: { rows: Row[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const all = rows.length > 0 && selected.length === rows.length;

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function run(action: "activate" | "deactivate" | "delete") {
    if (selected.length === 0 || pending) return;
    if (action === "delete" && !window.confirm(`Delete ${selected.length} selected products? An item that is already on an order cannot be deleted.`)) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: selected }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      setMessage(data.message || data.error || "Could not update the products.");
      if (response.ok) window.location.reload();
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" disabled={pending} className="min-h-11 rounded-full bg-forest-800 px-3 text-sm font-semibold text-cream-50 disabled:opacity-50" onClick={() => run("activate")}>Mark active</button>
        <button type="button" disabled={pending} className="min-h-11 rounded-full bg-white px-3 text-sm font-semibold disabled:opacity-50" onClick={() => run("deactivate")}>Mark inactive</button>
        <button type="button" disabled={pending} className="min-h-11 rounded-full px-3 text-sm font-semibold text-[#7F1D1D] disabled:opacity-50" onClick={() => run("delete")}>Delete selected</button>
        <a className="inline-flex min-h-11 items-center text-sm font-semibold underline" href="/api/admin/export?type=products">Export CSV</a>
      </div>
      {message ? <p className="mb-3 text-sm">{message}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead>
            <tr className="border-b border-cream-300">
              <th className="py-2 pr-2"><input type="checkbox" checked={all} aria-label="Select all products on this page" onChange={() => setSelected(all ? [] : rows.map((row) => row.id))} /></th>
              <th className="py-2">Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-cream-200">
                <td className="py-2 pr-2"><input type="checkbox" checked={selected.includes(row.id)} aria-label={`Select ${row.name}`} onChange={() => toggle(row.id)} /></td>
                <td className="py-2"><Link className="font-semibold underline" href={`/admin/products/${row.id}`}>{row.name}</Link><span className="block text-xs text-muted">{row.category}</span></td>
                <td>{row.sku}</td>
                <td>{formatINR(row.price)}{row.compareAtPrice ? ` / ${formatINR(row.compareAtPrice)}` : ""}</td>
                <td>{row.stock}</td>
                <td>{row.active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <p className="mt-3 text-sm">No products match these filters.</p> : null}
    </div>
  );
}
