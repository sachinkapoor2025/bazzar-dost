"use client";

import { useState } from "react";

export function FeaturedToggle({ id, featured }: { id: string; featured: boolean }) {
  const [error, setError] = useState("");
  async function toggle() {
    setError("");
    const response = await fetch(`/api/admin/products/${id}/flags`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !featured }),
    });
    if (!response.ok) {
      setError("This product could not be updated.");
      return;
    }
    window.location.reload();
  }
  return (
    <span>
      <button type="button" className="text-sm font-semibold underline" onClick={toggle}>{featured ? "Remove from homepage" : "Show on homepage"}</button>
      {error ? <span className="mt-1 block text-xs text-[#7F1D1D]">{error}</span> : null}
    </span>
  );
}
