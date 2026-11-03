"use client";

export function FeaturedToggle({ id, featured }: { id: string; featured: boolean }) {
  async function toggle() {
    await fetch(`/api/admin/products/${id}/flags`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !featured }),
    });
    window.location.reload();
  }
  return <button type="button" className="text-sm font-semibold underline" onClick={toggle}>{featured ? "Remove from homepage" : "Show on homepage"}</button>;
}
