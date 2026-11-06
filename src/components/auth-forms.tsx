"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";

export function LoginForm({ nextPath }: { nextPath: string }) {
  return <AuthForm path="/api/auth/login" nextPath={nextPath} title="Login" submitLabel="Sign in" fields={["email", "password"]} />;
}

export function RegisterForm({ nextPath }: { nextPath: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) {
      setError(data.error || "Could not create the account.");
      setPending(false);
      return;
    }
    setMessage(data.message || "Your account is ready.");
    window.setTimeout(() => {
      window.location.href = nextPath;
    }, 700);
  }

  return (
    <form onSubmit={onRegister} className="mx-auto grid max-w-md gap-3" aria-labelledby="auth-title">
      <h1 id="auth-title" className="font-display text-4xl">Create account</h1>
      <p className="text-sm leading-6 text-muted">Create your account with your name, email, and password.</p>
      <label className={labelClass} htmlFor="signup-name">Full name
        <input id="signup-name" name="name" required minLength={2} autoComplete="name" value={name} className={fieldClass} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className={labelClass} htmlFor="signup-email">Email address
        <input id="signup-email" name="email" type="email" required autoComplete="email" value={email} className={fieldClass} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label className={labelClass} htmlFor="signup-phone">Mobile (optional)
        <input id="signup-phone" name="phone" inputMode="numeric" autoComplete="tel" value={phone} className={fieldClass} onChange={(event) => setPhone(event.target.value)} />
      </label>
      <label className={labelClass} htmlFor="signup-password">Password
        <input id="signup-password" name="password" type="password" required minLength={8} autoComplete="new-password" value={password} className={fieldClass} onChange={(event) => setPassword(event.target.value)} />
      </label>
      {message ? <p role="status" className="text-sm text-forest-800">{message}</p> : null}
      {error ? <p role="alert" className="text-sm text-[#7F1D1D]">{error}</p> : null}
      <button className={buttonClass("primary")} disabled={pending}>{pending ? "Please wait…" : "Create account"}</button>
      <p className="text-sm"><Link href="/forgot-password" className="underline">Forgot password</Link> · <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="underline">Sign in</Link></p>
    </form>
  );
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
