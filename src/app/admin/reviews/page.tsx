import { AdminReviewList } from "@/components/admin-reviews";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await prisma.productReview.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  });
  return (
    <div>
      <h1 className="font-display text-4xl">Reviews</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">These are product reviews from customers who bought the item. A customer can review a product once. Remove a review to take it off the product page.</p>
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
