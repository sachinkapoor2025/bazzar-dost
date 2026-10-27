"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";

export function LoginForm({ nextPath }: { nextPath: string }) {
  return <AuthForm path="/api/auth/login" nextPath={nextPath} title="Login" submitLabel="Sign in" fields={["email", "password"]} />;
}

export function RegisterForm({ nextPath }: { nextPath: string }) {
  return <AuthForm path="/api/auth/register" nextPath={nextPath} title="Create account" submitLabel="Create account" fields={["name", "email", "phone", "password"]} />;
}

export function ForgotForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const email = String(new FormData(event.currentTarget).get("email") || "");
    const response = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    setMessage(data.message || data.error || "Could not start a reset.");
    setPending(false);
  }
  return (
    <form onSubmit={onSubmit} className="mx-auto grid max-w-md gap-3">
      <label className={labelClass}>Email<input name="email" type="email" required className={fieldClass} /></label>
      <button className={buttonClass("primary")} disabled={pending}>{pending ? "Sending…" : "Request reset"}</button>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const password = String(new FormData(event.currentTarget).get("password") || "");
    const response = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = (await response.json()) as { message?: string; error?: string };
    setMessage(data.message || data.error || "Could not reset the password.");
    setPending(false);
    if (response.ok) window.location.href = "/login";
  }
  return (
    <form onSubmit={onSubmit} className="mx-auto grid max-w-md gap-3">
      <label className={labelClass}>New password<input name="password" type="password" required minLength={8} className={fieldClass} /></label>
      <button className={buttonClass("primary")} disabled={pending || !token}>{pending ? "Saving…" : "Save password"}</button>
      {message ? <p role="status" className="text-sm">{message}</p> : null}
    </form>
  );
}

function AuthForm({
  path,
  nextPath,
  title,
  submitLabel,
  fields,
}: {
  path: string;
  nextPath: string;
  title: string;
  submitLabel: string;
  fields: Array<"name" | "email" | "phone" | "password">;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(fields.map((field) => [field, String(form.get(field) || "")]));
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "Could not continue.");
      setPending(false);
      return;
    }
    window.location.href = nextPath;
  }
  return (
    <form onSubmit={onSubmit} className="mx-auto grid max-w-md gap-3" aria-labelledby="auth-title">
      <h1 id="auth-title" className="font-display text-4xl">{title}</h1>
      {fields.includes("name") ? <label className={labelClass}>Name<input name="name" required className={fieldClass} /></label> : null}
      {fields.includes("email") ? <label className={labelClass}>Email<input name="email" type="email" required className={fieldClass} /></label> : null}
      {fields.includes("phone") ? <label className={labelClass}>Mobile (optional)<input name="phone" className={fieldClass} /></label> : null}
      {fields.includes("password") ? <label className={labelClass}>Password<input name="password" type="password" required className={fieldClass} /></label> : null}
      {error ? <p role="alert" className="text-sm text-[#7F1D1D]">{error}</p> : null}
      <button className={buttonClass("primary")} disabled={pending}>{pending ? "Please wait…" : submitLabel}</button>
      <p className="text-sm"><Link href="/forgot-password" className="underline">Forgot password</Link> · <Link href={path.includes("register") ? `/login?next=${encodeURIComponent(nextPath)}` : `/register?next=${encodeURIComponent(nextPath)}`} className="underline">{path.includes("register") ? "Sign in" : "Create an account"}</Link></p>
    </form>
  );
}
