"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { reviewSummary, type ProductReviewState, type PublicProductReview } from "@/lib/product-reviews";

export function ProductReviews({
  slug,
  initial,
}: {
  slug: string;
  initial: ProductReviewState;
}) {
  const [reviews, setReviews] = useState(initial.reviews);
  const [reason, setReason] = useState(initial.reason);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const ratingId = useId();
  const commentId = useId();
  const summary = reviewSummary(reviews);
  const loginHref = `/login?next=${encodeURIComponent(`/products/${slug}`)}`;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/products/${encodeURIComponent(slug)}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: form.get("rating"),
        comment: form.get("comment"),
        website: form.get("website"),
      }),
    });
    const data = (await response.json()) as { message?: string; error?: string; review?: PublicProductReview };
    setPending(false);
    if (!response.ok || !data.review) {
      setError(data.error || "The review could not be saved.");
      if (response.status === 409) setReason("already-reviewed");
      return;
    }
    setReviews((current) => [data.review as PublicProductReview, ...current]);
    setReason("already-reviewed");
    setMessage(data.message || "Review saved.");
    event.currentTarget.reset();
  }

  return (
    <div className="mt-2">
      <p className="text-sm font-semibold text-forest-800">
        {summary.count === 0 ? "No reviews yet" : `${summary.average} out of 5 · ${summary.count} ${summary.count === 1 ? "review" : "reviews"}`}
      </p>
      {reviews.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-cream-300 bg-white px-4 py-5 text-sm text-muted">No customer reviews yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-2xl border border-cream-300 bg-white p-4">
              <p className="text-sm font-semibold text-forest-800">{review.rating} out of 5</p>
              <p className="mt-2 text-sm leading-6">{review.comment}</p>
              <p className="mt-3 text-sm font-semibold">{review.name}</p>
              <p className="text-xs text-muted">{formatDate(review.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
      {reason === null ? (
        <form onSubmit={onSubmit} className="mt-4 max-w-xl rounded-2xl border border-cream-300 bg-white p-4">
          <h3 className="font-display text-2xl text-forest-900">Write a review</h3>
          <p className="mt-1 text-sm text-muted">This is published with your account name.</p>
          <label htmlFor={ratingId} className={`${labelClass} mt-3`}>Rating</label>
          <select id={ratingId} name="rating" required defaultValue="5" className={fieldClass}>
            <option value="5">5 out of 5</option>
            <option value="4">4 out of 5</option>
            <option value="3">3 out of 5</option>
            <option value="2">2 out of 5</option>
            <option value="1">1 out of 5</option>
          </select>
          <label htmlFor={commentId} className={`${labelClass} mt-3`}>Review</label>
          <textarea id={commentId} name="comment" required minLength={10} maxLength={600} rows={4} className={`${fieldClass} py-2`} />
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <button className={`${buttonClass("primary")} mt-4`} disabled={pending}>{pending ? "Saving…" : "Submit review"}</button>
          {message ? <p role="status" className="mt-2 text-sm text-forest-800">{message}</p> : null}
          {error ? <p role="alert" className="mt-2 text-sm text-[#7F1D1D]">{error}</p> : null}
        </form>
      ) : (
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
          {reason === "signed-out" ? <><Link href={loginHref} className="font-semibold text-forest-800 underline">Sign in</Link> to review this product after you buy it.</> : null}
          {reason === "not-purchased" ? "Only customers who bought this product can review it. Cancelled orders are not counted." : null}
          {reason === "already-reviewed" ? message || "You have already reviewed this product." : null}
          {reason === "unavailable" ? "Reviews cannot be loaded right now." : null}
        </p>
      )}
    </div>
  );
}
