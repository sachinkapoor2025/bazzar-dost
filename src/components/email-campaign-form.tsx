"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";

export function EmailCampaignForm({ templates }: { templates: Array<{ id: string; name: string; subject: string; message: string }> }) {
  const [subject, setSubject] = useState(templates[0]?.subject || "");
  const [message, setMessage] = useState(templates[0]?.message || "");
  const [audience, setAudience] = useState<"subscribers" | "custom">("subscribers");
  const [customEmails, setCustomEmails] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setNotice("");
    setError("");
    const response = await fetch("/api/admin/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message, audience, customEmails }),
    });
    const data = (await response.json()) as { error?: string; sent?: number; failed?: number; skipped?: number };
    setPending(false);
    if (!response.ok) {
      setError(data.error || "The message could not be sent.");
      return;
    }
    setNotice(`Sent ${data.sent || 0}. Failed ${data.failed || 0}. Held back for the next send ${data.skipped || 0}.`);
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-3">
      <label className={labelClass}>Start from a template
        <select className={fieldClass} onChange={(event) => {
          const template = templates.find((item) => item.id === event.target.value);
          if (!template) return;
          setSubject(template.subject);
          setMessage(template.message);
        }}>
          {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
        </select>
      </label>
      <label className={labelClass}>Subject
        <input className={fieldClass} required maxLength={140} value={subject} onChange={(event) => setSubject(event.target.value)} />
      </label>
      <label className={labelClass}>Message
        <textarea className={`${fieldClass} min-h-40 py-2`} required maxLength={5000} value={message} onChange={(event) => setMessage(event.target.value)} />
      </label>
      <label className={labelClass}>Recipients
        <select className={fieldClass} value={audience} onChange={(event) => setAudience(event.target.value === "custom" ? "custom" : "subscribers")}>
          <option value="subscribers">Newsletter subscribers</option>
          <option value="custom">Addresses typed below</option>
        </select>
      </label>
      {audience === "custom" ? (
        <label className={labelClass}>Email addresses
          <textarea className={`${fieldClass} min-h-24 py-2`} value={customEmails} onChange={(event) => setCustomEmails(event.target.value)} placeholder="One address per line" />
        </label>
      ) : null}
      {error ? <p role="alert" className="text-sm text-[#7F1D1D]">{error}</p> : null}
      {notice ? <p role="status" className="text-sm text-forest-800">{notice}</p> : null}
      <button className={`${buttonClass("primary")} w-fit`} disabled={pending}>{pending ? "Sending…" : "Send"}</button>
    </form>
  );
}
