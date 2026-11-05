import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProduct } from "@/lib/catalog";
import { errorResponse } from "@/lib/http";
import { saveProductReview } from "@/lib/product-review-store";
import { rateLimit } from "@/lib/rate-limit";
import { productReviewSchema } from "@/lib/validators";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to review a product you have bought." }, { status: 401 });
    if (!rateLimit(`product-review:${user.id}`, 8, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many reviews. Try again later." }, { status: 429 });
    }
    const product = await getProduct((await context.params).slug);
    if (!product) return NextResponse.json({ error: "This product is not available." }, { status: 404 });
    const body = productReviewSchema.parse(await request.json());
    if (body.website) return NextResponse.json({ message: "Review saved." });
    const result = await saveProductReview(
      { id: product.id, slug: product.slug, sku: product.sku, name: product.name },
      user,
      { rating: body.rating, comment: body.comment },
    );
    if (!result.review) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ message: "Review saved.", review: result.review });
  } catch (error) {
    return errorResponse(error);
  }
}
