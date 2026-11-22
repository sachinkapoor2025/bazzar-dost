"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";
import type { ShippingSettings } from "@/lib/admin-record-schema";

const fields: Array<{ name: keyof ShippingSettings; label: string; type?: string }> = [
  { name: "originName", label: "Origin name" },
  { name: "originPhone", label: "Origin phone" },
  { name: "originLine", label: "Origin address" },
  { name: "originCity", label: "Origin city" },
  { name: "originState", label: "Origin state" },
  { name: "originPincode", label: "Origin PIN" },
  { name: "flat", label: "Flat shipping (₹)", type: "number" },
  { name: "freeAbove", label: "Free shipping above (₹)", type: "number" },
  { name: "minDays", label: "Earliest delivery days" },
  { name: "maxDays", label: "Latest delivery days" },
  { name: "blockedPrefixes", label: "Blocked PIN prefixes, comma separated" },
  { name: "allowedPrefixes", label: "Allowed PIN prefixes, comma separated" },
  { name: "festivalName", label: "Festival window name" },
  { name: "festivalStart", label: "Festival start", type: "date" },
  { name: "festivalEnd", label: "Festival end", type: "date" },
];

export function ShippingSettingsForm({ initial }: { initial: ShippingSettings }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const body: Record<string, string | number> = {};
    for (const field of fields) body[field.name] = field.type === "number" ? Number(form.get(field.name) || 0) : String(form.get(field.name) || "");
    const response = await fetch("/api/admin/shipping", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await response.json()) as { error?: string; message?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error || "Could not save shipping settings.");
      return;
    }
    setMessage(data.message || "Shipping settings saved.");
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-3">
      {fields.map((field) => (
        <label key={field.name} className={labelClass}>{field.label}
          <input name={field.name} type={field.type || "text"} defaultValue={initial[field.name]} className={fieldClass} />
        </label>
      ))}
      <button className={buttonClass("primary")} disabled={pending}>{pending ? "Saving…" : "Save shipping"}</button>
      {error ? <p className="text-sm text-[#7F1D1D]" role="alert">{error}</p> : null}
      {message ? <p className="text-sm" role="status">{message}</p> : null}
    </form>
  );
}
