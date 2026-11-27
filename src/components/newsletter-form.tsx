"use client";

import { useId, useState } from "react";
import { buttonClass, fieldClass } from "@/components/ui";

export function NewsletterForm({ layout = "stack" }: { layout?: "stack" | "bar" }) {
  const emailId = useId();
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

  if (layout === "bar") {
    return (
      <form onSubmit={onSubmit} className="mt-2">
        <div className="flex flex-row items-center gap-2">
          <label htmlFor={emailId} className="sr-only">Email address</label>
          <input
            id={emailId}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Enter your email address"
            className="min-h-9 w-full flex-1 rounded-full border-0 bg-white px-4 text-sm text-ink outline-none ring-0 placeholder:text-muted/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8E6C9]"
          />
          <button
            className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full bg-[#C8E6C9] px-4 text-xs font-semibold text-forest-900 transition hover:bg-[#B7DCB9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
          >
            {pending ? "Saving…" : "Subscribe →"}
          </button>
        </div>
        {message ? <p role="status" className="mt-2 text-sm text-cream-50">{message}</p> : null}
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2">
      <label htmlFor={emailId} className="sr-only">Email address</label>
      <input id={emailId} name="email" type="email" required placeholder="Email address" className={fieldClass} />
      <button className={buttonClass("gold")} disabled={pending}>{pending ? "Saving…" : "Subscribe"}</button>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </form>
  );
}
