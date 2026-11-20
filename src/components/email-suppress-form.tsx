"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";

export function SuppressForm() {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice("");
    setError("");
    const email = String(new FormData(event.currentTarget).get("email") || "");
    const response = await fetch("/api/newsletter/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error || "That address could not be saved.");
      return;
    }
    setNotice("Address unsubscribed.");
    window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} className="grid content-start gap-3">
      <h2 className="font-display text-2xl">Add an address</h2>
      <label className={labelClass}>Email<input name="email" type="email" required className={fieldClass} /></label>
      {error ? <p role="alert" className="text-sm text-[#7F1D1D]">{error}</p> : null}
      {notice ? <p role="status" className="text-sm">{notice}</p> : null}
      <button className={`${buttonClass("outline")} w-fit`} disabled={pending}>{pending ? "Saving…" : "Unsubscribe"}</button>
    </form>
  );
}
