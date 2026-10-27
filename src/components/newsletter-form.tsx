"use client";

import { useState } from "react";
import { buttonClass, fieldClass } from "@/components/ui";

export function NewsletterForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const email = String(new FormData(event.currentTarget).get("email") || "");
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    setMessage(data.message || data.error || "Could not save that email.");
    setPending(false);
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2">
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input id="newsletter-email" name="email" type="email" required placeholder="Email address" className={fieldClass} />
      <button className={buttonClass("gold")} disabled={pending}>{pending ? "Saving…" : "Subscribe"}</button>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </form>
  );
}
