import "server-only";
import { ApiError, api } from "@/lib/backend";
import { reviewSummary, type ProductReviewState, type PublicProductReview } from "@/lib/product-reviews";
import type { PublicUser } from "@/lib/types";

export type { ProductReviewState, PublicProductReview };

type ProductIdentity = { id: string; slug: string; sku: string; name: string };

function remoteCatalogue(): boolean {
  return Boolean(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL);
}

const empty = (reason: ProductReviewState["reason"]): ProductReviewState => ({
  reviews: [],
  average: null,
  count: 0,
  canReview: false,
  reason,
});

function localState(user: PublicUser | null): ProductReviewState {
  const summary = reviewSummary([]);
  if (!user) return { ...summary, reviews: [], canReview: false, reason: "signed-out" };
  return { ...summary, reviews: [], canReview: false, reason: "unavailable" };
}

export async function getProductReviewState(product: ProductIdentity, user: PublicUser | null): Promise<ProductReviewState> {
  if (remoteCatalogue()) {
    try {
      return await api<ProductReviewState>(`/products/${encodeURIComponent(product.slug)}/reviews`);
    } catch (error) {
      console.error(error);
    }
  }
  return localState(user);
}

export async function saveProductReview(
  product: ProductIdentity,
  user: PublicUser,
  input: { rating: number; comment: string },
): Promise<{ status: number; error?: string; review?: PublicProductReview }> {
  if (!remoteCatalogue()) return { status: 503, error: "Reviews cannot be saved right now." };
  try {
    const saved = await api<{ review: PublicProductReview }>(`/products/${encodeURIComponent(product.slug)}/reviews`, {
      method: "POST",
      body: { rating: input.rating, comment: input.comment, userId: user.id },
    });
    return { status: 200, review: saved.review };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.status, error: error.message };
    console.error(error);
    return { status: 503, error: "Reviews cannot be saved right now." };
  }
}
