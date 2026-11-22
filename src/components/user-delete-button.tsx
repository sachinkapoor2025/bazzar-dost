"use client";

import { useState } from "react";

export function UserDeleteButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const [error, setError] = useState("");
  if (disabled) return null;
  async function remove() {
    if (!window.confirm("Delete this customer account? This cannot be undone.")) return;
    setError("");
    const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "Could not delete this user.");
      return;
    }
    window.location.reload();
  }
  return (
    <span>
      <button type="button" className="text-sm font-semibold text-[#7F1D1D] underline" onClick={() => void remove()}>Delete</button>
      {error ? <span className="mt-1 block text-xs text-[#7F1D1D]">{error}</span> : null}
    </span>
  );
}
