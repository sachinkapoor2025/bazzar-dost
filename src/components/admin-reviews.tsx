"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClass } from "@/components/ui";
import { formatDate } from "@/lib/format";

export type AdminReview = {
  id: string;
  productSlug: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer: string;
  email: string;
};

export function AdminReviewList({ reviews }: { reviews: AdminReview[] }) {
  const [items, setItems] = useState(reviews);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");

  async function remove(id: string) {
    if (!window.confirm("Remove this review from the product page?")) return;
    setPendingId(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "The review could not be removed.");
        return;
      }
      setItems((current) => current.filter((review) => review.id !== id));
    } catch {
      setError("The review could not be removed.");
    } finally {
      setPendingId("");
    }
  }

  if (items.length === 0) return <p className="mt-4 text-sm">No product reviews yet.</p>;
  return (
    <div>
      {error ? <p role="alert" className="mt-4 text-sm text-[#7F1D1D]">{error}</p> : null}
      <ul className="mt-4 grid gap-3">
        {items.map((review) => (
          <li key={review.id} className="rounded-2xl border border-cream-300 bg-white p-4 text-sm">
            <p className="font-semibold text-forest-900">{review.rating} out of 5 · Verified purchase</p>
            <p className="mt-1">
              <Link className="font-semibold underline" href={`/products/${review.productSlug}`}>{review.productSlug}</Link>
              <span className="text-muted"> · {review.customer} · {review.email}</span>
            </p>
            <p className="mt-2 whitespace-pre-wrap leading-6">{review.comment}</p>
            <p className="mt-2 text-xs text-muted">{formatDate(review.createdAt)}</p>
            <button type="button" className={`${buttonClass("outline")} mt-3`} disabled={pendingId === review.id} onClick={() => remove(review.id)}>
              {pendingId === review.id ? "Removing…" : "Remove review"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
