"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";

export function WholesaleForm({ initialProduct = "" }: { initialProduct?: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "wholesale",
        name: form.get("name"),
        business: form.get("business"),
        email: form.get("email"),
        phone: form.get("phone"),
        city: form.get("city"),
        productInterest: form.get("productInterest"),
        quantity: form.get("quantity"),
        message: form.get("message"),
      }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    setMessage(data.message || data.error || "Could not send the enquiry.");
    setPending(false);
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-3xl border border-cream-300 bg-white p-4">
      <h2 className="font-display text-2xl">Business enquiry</h2>
      <Field name="name" label="Your name" />
      <Field name="business" label="Business name" />
      <Field name="email" label="Email" type="email" />
      <Field name="phone" label="Mobile number" />
      <Field name="city" label="City" />
      <Field name="productInterest" label="Products" defaultValue={initialProduct} />
      <Field name="quantity" label="Approximate quantity" />
      <label className={labelClass}>Message
        <textarea name="message" required minLength={10} className={`${fieldClass} min-h-28 py-2`} />
      </label>
      <button className={buttonClass("primary")} disabled={pending}>{pending ? "Sending…" : "Send enquiry"}</button>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </form>
  );
}

export function ContactForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "contact",
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        subject: form.get("subject"),
        message: form.get("message"),
      }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    setMessage(data.message || data.error || "Could not send the message.");
    setPending(false);
    if (response.ok) event.currentTarget.reset();
  }
  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <Field name="name" label="Name" />
      <Field name="email" label="Email" type="email" />
      <Field name="phone" label="Mobile (optional)" required={false} />
      <Field name="subject" label="Subject" />
      <label className={labelClass}>Message
        <textarea name="message" required minLength={10} className={`${fieldClass} min-h-32 py-2`} />
      </label>
      <button className={buttonClass("primary")} disabled={pending}>{pending ? "Sending…" : "Send message"}</button>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </form>
  );
}

function Field({ name, label, type = "text", defaultValue = "", required = true }: { name: string; label: string; type?: string; defaultValue?: string; required?: boolean }) {
  return (
    <label className={labelClass}>{label}
      <input name={name} type={type} required={required} defaultValue={defaultValue} className={`${fieldClass} mt-1`} />
    </label>
  );
}
