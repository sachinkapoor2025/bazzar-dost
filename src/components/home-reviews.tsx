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
  if (reviews.length === 0) {
    return <p className="rounded-2xl border border-dashed border-cream-300 bg-white px-4 py-5 text-sm text-muted">No customer reviews yet.</p>;
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-2xl border border-cream-300 bg-white p-4">
          <p className="text-sm font-semibold tracking-wide text-gold-700" aria-label={`${review.rating} out of 5 stars`}>
            <span aria-hidden="true">{"★".repeat(Math.max(0, Math.min(5, review.rating)))}{"☆".repeat(Math.max(0, 5 - review.rating))}</span>
          </p>
          <p className="mt-2 text-sm leading-6">{review.comment}</p>
          <p className="mt-3 text-sm font-semibold">{review.name}{review.city ? `, ${review.city}` : ""}</p>
          <p className="text-xs text-muted">{formatDate(review.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}
