import { NextResponse } from "next/server";
import { reviewRequestSchema } from "@/lib/admin-record-schema";
import { requireAdmin } from "@/lib/auth";
import { sendCampaign } from "@/lib/email-marketing";
import { errorResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = reviewRequestSchema.parse(await request.json());
    const result = await sendCampaign({ subject: body.subject, message: body.message, audience: "custom", customEmails: body.email });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ message: result.sent ? "Review request sent." : "The message was not delivered." });
  } catch (error) {
    return errorResponse(error);
  }
}
