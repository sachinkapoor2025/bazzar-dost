import "server-only";
import { prisma } from "@/lib/db";
import { cleanText } from "@/lib/format";
import { reviewDecision, reviewSummary, type ProductReviewState, type PublicProductReview, type ReviewRecord } from "@/lib/product-reviews";
import type { PublicUser } from "@/lib/types";

export type { ProductReviewState, PublicProductReview };

type ProductIdentity = { id: string; slug: string; sku: string; name: string };

function databaseConfigured(): boolean {
  const url = process.env.DATABASE_URL || "";
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

const empty = (reason: ProductReviewState["reason"]): ProductReviewState => ({
  reviews: [],
  average: null,
  count: 0,
  canReview: false,
  reason,
});

async function purchasedOrderId(user: PublicUser, product: ProductIdentity): Promise<string | null> {
  const order = await prisma.order.findFirst({
    where: {
      status: { not: "cancelled" },
      OR: [{ userId: user.id }, { email: user.email.toLowerCase() }],
      items: {
        some: {
          OR: [
            { productId: product.id },
            { sku: product.sku },
            { name: product.name },
            { name: { startsWith: `${product.name} —` } },
          ],
        },
      },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  return order?.id ?? null;
}

export async function getProductReviewState(product: ProductIdentity, user: PublicUser | null): Promise<ProductReviewState> {
  if (!databaseConfigured()) return empty(user ? "unavailable" : "signed-out");
  try {
    const rows = await prisma.productReview.findMany({
      where: { productSlug: product.slug },
      orderBy: { createdAt: "desc" },
      take: 24,
      select: { id: true, userId: true, rating: true, comment: true, createdAt: true, user: { select: { name: true } } },
    });
    const summary = reviewSummary(rows);
    const reviews = rows.map((row) => ({
      id: row.id,
      name: row.user.name,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
    }));
    if (!user) return { ...summary, reviews, canReview: false, reason: "signed-out" };
    const already = rows.some((row) => row.userId === user.id);
    if (already) return { ...summary, reviews, canReview: false, reason: "already-reviewed" };
    const orderId = await purchasedOrderId(user, product);
    if (!orderId) return { ...summary, reviews, canReview: false, reason: "not-purchased" };
    return { ...summary, reviews, canReview: true, reason: null };
  } catch (error) {
    console.error(error);
    return empty("unavailable");
  }
}

export async function saveProductReview(
  product: ProductIdentity,
  user: PublicUser,
  input: { rating: number; comment: string },
): Promise<{ status: number; error?: string; review?: PublicProductReview }> {
  if (!databaseConfigured()) return { status: 503, error: "Reviews cannot be saved right now." };
  try {
    const existing = await prisma.productReview.findMany({
      where: { productSlug: product.slug },
      select: { userId: true, productSlug: true, rating: true },
    });
    const records: ReviewRecord[] = existing.map((row) => ({ userId: row.userId, productSlug: row.productSlug, rating: row.rating }));
    const orderId = await purchasedOrderId(user, product);
    const decision = reviewDecision({
      userId: user.id,
      purchasedOrderId: orderId,
      existing: records,
      productSlug: product.slug,
      rating: input.rating,
      comment: input.comment,
    });
    if (!decision.ok) return { status: decision.status, error: decision.error };
    const review = await prisma.productReview.create({
      data: {
        userId: user.id,
        productSlug: product.slug,
        orderId: decision.orderId,
        rating: input.rating,
        comment: cleanText(input.comment, 600),
      },
      select: { id: true, rating: true, comment: true, createdAt: true },
    });
    return {
      status: 200,
      review: {
        id: review.id,
        name: user.name,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
      },
    };
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") {
      return { status: 409, error: "You have already reviewed this product." };
    }
    console.error(error);
    return { status: 503, error: "Reviews cannot be saved right now." };
  }
}
