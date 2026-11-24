import { AdminReviewList } from "@/components/admin-reviews";
import { databaseConfigured, readDatabase } from "@/lib/db";
import { listProductReviews } from "@/lib/local-reviews";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const storedReviews = databaseConfigured()
    ? await readDatabase([], (client) => client.productReview.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { user: { select: { name: true, email: true } } },
      }))
    : [];
  const reviews = storedReviews.length > 0
    ? storedReviews
    : listProductReviews().slice(0, 100).map((review) => ({
        id: review.id,
        productSlug: review.productSlug,
        rating: review.rating,
        comment: review.comment,
        createdAt: new Date(review.createdAt),
        user: { name: review.userName, email: review.userEmail },
      }));
  return (
    <div>
      <h1 className="font-display text-4xl">Reviews</h1>
      <p className="mt-2 text-sm leading-6 text-muted">These are product reviews from customers who bought the item. A customer can leave another review of the same product. Remove a review to take it off the product page.</p>
      <AdminReviewList
        reviews={reviews.map((review) => ({
          id: review.id,
          productSlug: review.productSlug,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt.toISOString(),
          customer: review.user.name,
          email: review.user.email,
        }))}
      />
    </div>
  );
}
