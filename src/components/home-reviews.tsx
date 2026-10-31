"use client";

import { useId, useState } from "react";
import { buttonClass, fieldClass, labelClass } from "@/components/ui";
import { formatDate } from "@/lib/format";

export type PublicReview = {
  id: string;
  name: string;
  city: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export function HomeReviews({ reviews }: { reviews: PublicReview[] }) {
  const [items, setItems] = useState(reviews);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const nameId = useId();
  const cityId = useId();
  const ratingId = useId();
  const commentId = useId();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        city: form.get("city"),
        rating: form.get("rating"),
        comment: form.get("comment"),
        website: form.get("website"),
      }),
    });
    const data = (await response.json()) as { message?: string; error?: string; review?: PublicReview };
    setPending(false);
    if (!response.ok || !data.review) {
      setError(data.error || "The review could not be saved.");
      return;
    }
    setItems((current) => [data.review as PublicReview, ...current].slice(0, 12));
    setMessage(data.message || "Review saved.");
    event.currentTarget.reset();
  }

  return (
    <section>
      <p className="mb-4 max-w-2xl text-sm leading-6 text-muted">Reviews here are sent by customers through the form. The store does not write them.</p>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-cream-300 bg-white px-4 py-5 text-sm text-muted">No customer reviews yet.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((review) => (
            <li key={review.id} className="rounded-2xl border border-cream-300 bg-white p-4">
              <p className="text-sm font-semibold text-forest-800">{review.rating} out of 5</p>
              <p className="mt-2 text-sm leading-6">{review.comment}</p>
              <p className="mt-3 text-sm font-semibold">{review.name}{review.city ? `, ${review.city}` : ""}</p>
              <p className="text-xs text-muted">{formatDate(review.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit} className="mt-4 max-w-xl rounded-2xl border border-cream-300 bg-white p-4">
        <h3 className="font-display text-2xl text-forest-900">Write a review</h3>
        <label htmlFor={nameId} className={`${labelClass} mt-3`}>Name</label>
        <input id={nameId} name="name" required maxLength={60} className={fieldClass} />
        <label htmlFor={cityId} className={`${labelClass} mt-3`}>City <span className="font-normal text-muted">(optional)</span></label>
        <input id={cityId} name="city" maxLength={40} className={fieldClass} />
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
    </section>
  );
}
