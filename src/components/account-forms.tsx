"use client";

import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";
import { INDIAN_STATES } from "@/lib/states";

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), phone: form.get("phone") }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setMessage(data.message || data.error || "Could not update the profile.");
    setPending(false);
  }
  return (
    <form onSubmit={onSubmit} className="grid max-w-lg gap-3">
      <label className={labelClass}>Name<input name="name" defaultValue={name} required className={fieldClass} /></label>
      <label className={labelClass}>Mobile<input name="phone" defaultValue={phone} className={fieldClass} /></label>
      <button className={buttonClass("primary")} disabled={pending}>Save profile</button>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </form>
  );
}

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export function AddressManager({ initial }: { initial: Address[] }) {
  const [addresses, setAddresses] = useState(initial);
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: form.get("label"),
        fullName: form.get("fullName"),
        phone: form.get("phone"),
        line1: form.get("line1"),
        line2: form.get("line2"),
        city: form.get("city"),
        state: form.get("state"),
        pincode: form.get("pincode"),
        isDefault: form.get("isDefault") === "on",
      }),
    });
    const data = (await response.json()) as { error?: string; addresses?: Address[] };
    if (!response.ok || !data.addresses) {
      setMessage(data.error || "Could not save the address.");
      return;
    }
    setAddresses(data.addresses);
    setMessage("Address saved.");
    event.currentTarget.reset();
  }

  async function remove(id: string) {
    const response = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string; addresses?: Address[] };
    if (data.addresses) setAddresses(data.addresses);
    else setMessage(data.error || "Could not remove the address.");
  }

  return (
    <div className="grid gap-6">
      {addresses.length === 0 ? <p className="text-sm">No saved addresses yet.</p> : (
        <ul className="grid gap-3">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-2xl border border-cream-300 bg-white p-3 text-sm">
              <p className="font-semibold">{address.label}{address.isDefault ? " · Default" : ""}</p>
              <p>{address.fullName}, {address.phone}</p>
              <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
              <p>{address.city}, {address.state} {address.pincode}</p>
              <button type="button" className={buttonClass("danger", "mt-2")} onClick={() => remove(address.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit} className="grid max-w-lg gap-3">
        <h2 className="font-display text-2xl">Add an address</h2>
        <label className={labelClass}>Label<input name="label" defaultValue="Home" required className={fieldClass} /></label>
        <label className={labelClass}>Full name<input name="fullName" required className={fieldClass} /></label>
        <label className={labelClass}>Mobile<input name="phone" required className={fieldClass} /></label>
        <label className={labelClass}>Address<input name="line1" required className={fieldClass} /></label>
        <label className={labelClass}>Address line 2<input name="line2" className={fieldClass} /></label>
        <label className={labelClass}>City<input name="city" required className={fieldClass} /></label>
        <label className={labelClass}>State
          <select name="state" className={fieldClass}>{INDIAN_STATES.map((state) => <option key={state}>{state}</option>)}</select>
        </label>
        <label className={labelClass}>PIN code<input name="pincode" required className={fieldClass} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isDefault" /> Default address</label>
        <button className={buttonClass("primary")}>Save address</button>
        {message ? <p role="status" className="text-sm">{message}</p> : null}
      </form>
    </div>
  );
}
