export type ReviewRecord = {
  userId: string;
  productSlug: string;
  rating: number;
};

export type PublicProductReview = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ProductReviewState = {
  reviews: PublicProductReview[];
  average: number | null;
  count: number;
  canReview: boolean;
  reason: "signed-out" | "not-purchased" | "already-reviewed" | "unavailable" | null;
};

export type ReviewDecision =
  | { ok: true; orderId: string }
  | { ok: false; status: number; error: string };

export function reviewSummary(reviews: Array<{ rating: number }>): { average: number | null; count: number } {
  if (reviews.length === 0) return { average: null, count: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  const average = Math.round((total / reviews.length) * 10) / 10;
  return { average, count: reviews.length };
}

export function reviewDecision(input: {
  userId: string | null;
  purchasedOrderId: string | null;
  existing: ReviewRecord[];
  productSlug: string;
  rating: number;
  comment: string;
}): ReviewDecision {
  if (!input.userId) {
    return { ok: false, status: 401, error: "Sign in to review a product you have bought." };
  }
  if (!input.purchasedOrderId) {
    return { ok: false, status: 403, error: "Only customers who bought this product can review it." };
  }
  const duplicate = input.existing.some((review) => review.userId === input.userId && review.productSlug === input.productSlug);
  if (duplicate) {
    return { ok: false, status: 409, error: "You have already reviewed this product." };
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, status: 400, error: "Choose a rating." };
  }
  const comment = input.comment.trim();
  if (comment.length < 10) return { ok: false, status: 400, error: "Write at least a short review." };
  if (comment.length > 600) return { ok: false, status: 400, error: "Keep the review under 600 characters." };
  return { ok: true, orderId: input.purchasedOrderId };
}
