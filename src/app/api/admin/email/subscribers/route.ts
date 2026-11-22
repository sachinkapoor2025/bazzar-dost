import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { listNewsletterSubscribers, saveInquiry } from "@/lib/inquiry-store";

const schema = z.object({ email: z.string().trim().email().max(120) });

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ subscribers: await listNewsletterSubscribers() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const saved = await saveInquiry({ type: "newsletter", email: body.email.toLowerCase(), subject: "Added by staff" });
    if (!saved.ok) return NextResponse.json({ error: "That email cannot be saved right now." }, { status: 503 });
    if (saved.duplicate) return NextResponse.json({ error: "That email is already on the list." }, { status: 400 });
    return NextResponse.json({ message: "Subscriber added." });
  } catch (error) {
    return errorResponse(error);
  }
}
