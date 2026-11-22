"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";

type Status = {
  ready: boolean;
  source: "environment" | "saved" | "none";
  host: string;
  port: string;
  user: string;
  from: string;
  passwordSet: boolean;
};

export function MailSettingsForm({ status }: { status: Status }) {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [passwordSet, setPasswordSet] = useState(status.passwordSet);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice("");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/email/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: form.get("host"),
        port: form.get("port"),
        user: form.get("user"),
        from: form.get("from"),
        password: form.get("password"),
      }),
    });
    const data = (await response.json()) as { error?: string; status?: Status };
    setPending(false);
    if (!response.ok) {
      setError(data.error || "The mail settings could not be saved.");
      return;
    }
    setPasswordSet(Boolean(data.status?.passwordSet));
    setNotice("Mail settings saved.");
    const password = event.currentTarget.elements.namedItem("password");
    if (password instanceof HTMLInputElement) password.value = "";
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid max-w-xl gap-3">
      <h2 className="font-display text-2xl">Saved mail server</h2>
      <p className="text-sm leading-6 text-muted">Use this when the server environment does not already name a mail host. Mailercloud and other SMTP servers both work. Leave the password blank to keep the one already saved. The password is not shown again.</p>
      <label className={labelClass}>Host
        <input name="host" required defaultValue={status.host} autoComplete="off" className={fieldClass} placeholder="smtp.example.com" />
      </label>
      <label className={labelClass}>Port
        <input name="port" required defaultValue={status.port || "587"} inputMode="numeric" className={fieldClass} />
      </label>
      <label className={labelClass}>Username
        <input name="user" defaultValue={status.user} autoComplete="off" className={fieldClass} />
      </label>
      <label className={labelClass}>Password
        <input name="password" type="password" autoComplete="new-password" className={fieldClass} placeholder={passwordSet ? "Saved. Enter a new password to replace it." : "Required when the server asks for a login."} />
      </label>
      <label className={labelClass}>From address
        <input name="from" type="email" required defaultValue={status.from} className={fieldClass} />
      </label>
      {error ? <p role="alert" className="text-sm text-[#7F1D1D]">{error}</p> : null}
      {notice ? <p role="status" className="text-sm">{notice}</p> : null}
      <button className={`${buttonClass("primary")} w-fit`} disabled={pending}>{pending ? "Saving…" : "Save mail settings"}</button>
    </form>
  );
}
