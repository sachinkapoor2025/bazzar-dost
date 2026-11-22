"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";

export function UploadRecipientsForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const emails = String(new FormData(event.currentTarget).get("emails") || "");
    const response = await fetch("/api/admin/email/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error || "The list was not saved.");
      return;
    }
    setMessage(data.message || "Subscribers saved.");
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-3">
      <label className={labelClass}>Email addresses
        <textarea name="emails" required className={`${fieldClass} min-h-40 py-2`} placeholder="one@example.com, two@example.com" />
      </label>
      <button className={buttonClass("primary")} disabled={pending}>{pending ? "Saving…" : "Add subscribers"}</button>
      {error ? <p className="text-sm text-[#7F1D1D]" role="alert">{error}</p> : null}
      {message ? <p className="text-sm" role="status">{message}</p> : null}
    </form>
  );
}

export function ReviewRequestForm({ defaults }: { defaults: { email?: string; subject: string; message: string } }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm("Send this review request now?")) return;
    setPending(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/email/review-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), subject: form.get("subject"), message: form.get("message") }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error || "The request was not sent.");
      return;
    }
    setMessage(data.message || "Sent.");
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-3">
      <label className={labelClass}>Customer email<input name="email" type="email" required defaultValue={defaults.email || ""} className={fieldClass} /></label>
      <label className={labelClass}>Subject<input name="subject" required defaultValue={defaults.subject} className={fieldClass} /></label>
      <label className={labelClass}>Message<textarea name="message" required defaultValue={defaults.message} className={`${fieldClass} min-h-32 py-2`} /></label>
      <button className={buttonClass("primary")} disabled={pending}>{pending ? "Sending…" : "Send review request"}</button>
      {error ? <p className="text-sm text-[#7F1D1D]" role="alert">{error}</p> : null}
      {message ? <p className="text-sm" role="status">{message}</p> : null}
    </form>
  );
}
