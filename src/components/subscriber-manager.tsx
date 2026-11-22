"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";

type Subscriber = { id: string; email: string; createdAt: string };

export function SubscriberManager({ subscribers }: { subscribers: Subscriber[] }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") || "");
    setPending("add");
    setError("");
    const response = await fetch("/api/admin/email/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json()) as { error?: string };
    setPending("");
    if (!response.ok) {
      setError(data.error || "The subscriber was not added.");
      return;
    }
    window.location.reload();
  }

  async function save(id: string, email: string) {
    setPending(id);
    setError("");
    const response = await fetch(`/api/admin/email/subscribers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json()) as { error?: string };
    setPending("");
    if (!response.ok) {
      setError(data.error || "The subscriber was not updated.");
      return;
    }
    window.location.reload();
  }

  async function remove(id: string, email: string) {
    if (!window.confirm(`Remove ${email} from the list?`)) return;
    setPending(id);
    setError("");
    const response = await fetch(`/api/admin/email/subscribers/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    setPending("");
    if (!response.ok) {
      setError(data.error || "The subscriber was not removed.");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl">Subscriber list</h2>
        <a className="text-sm font-semibold underline" href="/api/admin/export?type=subscribers">Export CSV</a>
      </div>
      <form onSubmit={add} className="mt-3 flex max-w-xl flex-wrap items-end gap-2">
        <label className={labelClass}>Add one address
          <input name="email" type="email" required className={fieldClass} />
        </label>
        <button className={buttonClass("primary")} disabled={pending === "add"}>{pending === "add" ? "Saving…" : "Add"}</button>
      </form>
      {error ? <p role="alert" className="mt-2 text-sm text-[#7F1D1D]">{error}</p> : null}
      <ul className="mt-4 divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white">
        {subscribers.length === 0 ? <li className="px-4 py-3 text-sm text-muted">No subscribers stored yet.</li> : subscribers.map((subscriber) => (
          <li key={subscriber.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
            <form className="flex min-w-0 flex-1 flex-wrap items-center gap-2" onSubmit={(event) => {
              event.preventDefault();
              const email = String(new FormData(event.currentTarget).get("email") || "");
              void save(subscriber.id, email);
            }}>
              <input name="email" type="email" required defaultValue={subscriber.email} className={`${fieldClass} min-w-0 flex-1`} />
              <button className={buttonClass("outline")} disabled={pending === subscriber.id}>Save</button>
            </form>
            <button type="button" className={buttonClass("outline")} disabled={pending === subscriber.id} onClick={() => void remove(subscriber.id, subscriber.email)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
