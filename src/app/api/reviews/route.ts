import { NextResponse } from "next/server";
import { api } from "@/lib/backend";
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
    const review = await api<{ id: string; name: string; city: string; rating: number; comment: string; createdAt: string }>("/reviews", {
      body: { name: cleanText(body.name, 60), city: cleanText(body.city, 40), rating: body.rating, comment: cleanText(body.comment, 600) },
    });
    return NextResponse.json({ message: "Review saved. It is now on the homepage.", review });
  } catch (error) {
    return errorResponse(error);
  }
}
