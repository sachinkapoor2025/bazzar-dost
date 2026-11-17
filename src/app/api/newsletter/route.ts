import { NextResponse } from "next/server";
import { saveInquiry } from "@/lib/inquiry-store";
import { errorResponse } from "@/lib/http";
import { newsletterSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = newsletterSchema.parse(await request.json());
    const saved = await saveInquiry({ type: "newsletter", email: body.email.toLowerCase() });
    if (!saved.ok) return NextResponse.json({ error: "That email cannot be saved right now." }, { status: 503 });
    if (saved.duplicate) return NextResponse.json({ message: "This email is already on the list." });
    return NextResponse.json({ message: "You're on the list. The store can use this address for BazaarDost updates." });
  } catch (error) {
    return errorResponse(error);
  }
}
