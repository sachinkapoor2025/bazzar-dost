import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanText } from "@/lib/format";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { reviewSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    if (!rateLimit("review", 8, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many reviews. Try again later." }, { status: 429 });
    }
    const body = reviewSchema.parse(await request.json());
    if (body.website) return NextResponse.json({ message: "Review saved." });
    const review = await prisma.review.create({
      data: {
        name: cleanText(body.name, 60),
        city: cleanText(body.city, 40),
        rating: body.rating,
        comment: cleanText(body.comment, 600),
      },
      select: { id: true, name: true, city: true, rating: true, comment: true, createdAt: true },
    });
    return NextResponse.json({
      message: "Review saved. It is now on the homepage.",
      review: { ...review, createdAt: review.createdAt.toISOString() },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
