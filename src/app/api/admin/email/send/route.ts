import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendCampaign } from "@/lib/email-marketing";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  subject: z.string().trim().min(1).max(140),
  message: z.string().trim().min(1).max(5000),
  audience: z.enum(["subscribers", "custom"]),
  customEmails: z.string().max(8000).optional(),
});

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!rateLimit(`email-campaign:${admin.id}`, 6, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many sends. Wait and try again." }, { status: 429 });
    }
    const body = schema.parse(await request.json());
    const result = await sendCampaign(body);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
