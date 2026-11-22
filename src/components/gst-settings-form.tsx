"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";
import type { GstSettings } from "@/lib/admin-record-schema";

export function GstSettingsForm({ initial }: { initial: GstSettings }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/gst", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legalName: form.get("legalName"),
        gstin: form.get("gstin"),
        ratePercent: Number(form.get("ratePercent") || 0),
      }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setError(response.ok ? "" : data.error || "Could not save GST settings.");
    setMessage(response.ok ? data.message || "GST settings saved." : "");
    if (response.ok) window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-3 rounded-2xl border border-cream-300 bg-white p-4">
      <label className={labelClass}>Legal name<input name="legalName" defaultValue={initial.legalName} className={fieldClass} /></label>
      <label className={labelClass}>GSTIN<input name="gstin" defaultValue={initial.gstin} className={fieldClass} /></label>
      <label className={labelClass}>GST rate percent<input name="ratePercent" type="number" min={0} max={28} defaultValue={initial.ratePercent} className={fieldClass} /></label>
      <button className={buttonClass("primary")}>Save GST settings</button>
      {error ? <p className="text-sm text-[#7F1D1D]" role="alert">{error}</p> : null}
      {message ? <p className="text-sm" role="status">{message}</p> : null}
    </form>
  );
}
