import { NextResponse } from "next/server";
import { z } from "zod";
import { suppressEmail } from "@/lib/email-marketing";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().email().max(120) });

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    if (!rateLimit(`unsubscribe:${body.email.toLowerCase()}`, 8, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const saved = await suppressEmail(body.email);
    if (!saved) return NextResponse.json({ error: "That address could not be saved." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
