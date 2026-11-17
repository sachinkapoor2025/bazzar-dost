import "server-only";
import { databaseConfigured, prisma } from "@/lib/db";
import { cleanText } from "@/lib/format";
import { listProductReviews, saveProductReviewRecord } from "@/lib/local-reviews";
import { listLocalOrders } from "@/lib/local-orders";
import { reviewDecision, reviewSummary, type ProductReviewState, type PublicProductReview, type ReviewRecord } from "@/lib/product-reviews";
import type { PublicUser } from "@/lib/types";

export type { ProductReviewState, PublicProductReview };

type ProductIdentity = { id: string; slug: string; sku: string; name: string };

const empty = (reason: ProductReviewState["reason"]): ProductReviewState => ({
  reviews: [],
  average: null,
  count: 0,
  canReview: false,
  reason,
});

function localPurchasedOrderId(user: PublicUser, product: ProductIdentity): string | null {
  const order = listLocalOrders().find((item) => {
    if (item.status === "cancelled") return false;
    if (item.userId !== user.id && item.email !== user.email.toLowerCase()) return false;
    return item.items.some((line) => line.productId === product.id || line.sku === product.sku || line.name === product.name || line.name.startsWith(`${product.name} —`));
  });
  return order?.id ?? null;
}

async function purchasedOrderId(user: PublicUser, product: ProductIdentity): Promise<string | null> {
  if (!databaseConfigured()) return localPurchasedOrderId(user, product);
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
  if (!databaseConfigured()) {
    const rows = listProductReviews().filter((review) => review.productSlug === product.slug).slice(0, 24);
    const summary = reviewSummary(rows);
    const reviews = rows.map((row) => ({ id: row.id, name: row.userName, rating: row.rating, comment: row.comment, createdAt: row.createdAt }));
    if (!user) return { ...summary, reviews, canReview: false, reason: "signed-out" };
    if (rows.some((row) => row.userId === user.id)) return { ...summary, reviews, canReview: false, reason: "already-reviewed" };
    if (!localPurchasedOrderId(user, product)) return { ...summary, reviews, canReview: false, reason: "not-purchased" };
    return { ...summary, reviews, canReview: true, reason: null };
  }
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
  if (!databaseConfigured()) {
    const existing = listProductReviews().filter((review) => review.productSlug === product.slug);
    const records: ReviewRecord[] = existing.map((row) => ({ userId: row.userId, productSlug: row.productSlug, rating: row.rating }));
    const orderId = localPurchasedOrderId(user, product);
    const decision = reviewDecision({
      userId: user.id,
      purchasedOrderId: orderId,
      existing: records,
      productSlug: product.slug,
      rating: input.rating,
      comment: input.comment,
    });
    if (!decision.ok) return { status: decision.status, error: decision.error };
    const review = saveProductReviewRecord({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      productSlug: product.slug,
      orderId: decision.orderId,
      rating: input.rating,
      comment: cleanText(input.comment, 600),
    });
    if (!review) return { status: 409, error: "You have already reviewed this product." };
    return { status: 200, review: { id: review.id, name: user.name, rating: review.rating, comment: review.comment, createdAt: review.createdAt } };
  }
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

export async function loadReviewAverages(): Promise<Map<string, number>> {
  const averages = new Map<string, number>();
  if (!databaseConfigured()) {
    const grouped = new Map<string, number[]>();
    for (const review of listProductReviews()) {
      const ratings = grouped.get(review.productSlug) || [];
      ratings.push(review.rating);
      grouped.set(review.productSlug, ratings);
    }
    for (const [slug, ratings] of grouped) {
      averages.set(slug, ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length);
    }
    return averages;
  }
  try {
    const rows = await prisma.productReview.groupBy({
      by: ["productSlug"],
      _avg: { rating: true },
    });
    for (const row of rows) {
      if (row._avg.rating == null) continue;
      averages.set(row.productSlug, row._avg.rating);
    }
  } catch (error) {
    console.error(error);
  }
  return averages;
}
