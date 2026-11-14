"use client";

import { useId, useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";

export function PincodeChecker() {
  const pinId = useId();
  const [pincode, setPincode] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setAvailable(null);
    try {
      const response = await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode }),
      });
      const data = (await response.json()) as { message?: string; error?: string; available?: boolean };
      setMessage(data.message || data.error || "Delivery could not be checked.");
      setAvailable(typeof data.available === "boolean" ? data.available : null);
    } catch {
      setMessage("Delivery could not be checked. Try again.");
      setAvailable(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 rounded-2xl border border-cream-300 bg-white p-4">
      <h2 className="font-display text-2xl text-forest-900">Check delivery</h2>
      <p className="mt-1 text-sm leading-6 text-muted">Enter a PIN code to see whether this store can deliver there. A date appears only when the store has configured one.</p>
      <label htmlFor={pinId} className={`${labelClass} mt-3`}>PIN code</label>
      <div className="flex flex-wrap gap-2">
        <input
          id={pinId}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          value={pincode}
          onChange={(event) => setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className={`${fieldClass} max-w-[10rem]`}
          placeholder="6 digits"
        />
        <button type="submit" className={buttonClass("primary")} disabled={pending}>{pending ? "Checking…" : "Check"}</button>
      </div>
      {message ? (
        <p role="status" className={`mt-3 text-sm leading-6 ${available === false ? "text-[#7F1D1D]" : "text-forest-900"}`}>{message}</p>
      ) : null}
    </form>
  );
}
