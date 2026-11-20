import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { saveTemplate } from "@/lib/email-marketing";
import { errorResponse } from "@/lib/http";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  subject: z.string().trim().min(1).max(140),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const saved = await saveTemplate(body);
    if (!saved) return NextResponse.json({ error: "The template could not be saved." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
