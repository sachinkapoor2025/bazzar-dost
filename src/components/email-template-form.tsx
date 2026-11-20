"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";

export function TemplateForm() {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice("");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/email/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") || ""),
        subject: String(form.get("subject") || ""),
        message: String(form.get("message") || ""),
      }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error || "The template could not be saved.");
      return;
    }
    setNotice("Template saved.");
    window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <h2 className="font-display text-2xl">Save a template</h2>
      <label className={labelClass}>Name<input name="name" required maxLength={80} className={fieldClass} /></label>
      <label className={labelClass}>Subject<input name="subject" required maxLength={140} className={fieldClass} /></label>
      <label className={labelClass}>Message<textarea name="message" required maxLength={5000} className={`${fieldClass} min-h-32 py-2`} /></label>
      {error ? <p role="alert" className="text-sm text-[#7F1D1D]">{error}</p> : null}
      {notice ? <p role="status" className="text-sm">{notice}</p> : null}
      <button className={`${buttonClass("primary")} w-fit`} disabled={pending}>{pending ? "Saving…" : "Save template"}</button>
    </form>
  );
}
