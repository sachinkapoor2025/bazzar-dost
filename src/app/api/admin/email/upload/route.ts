import { NextResponse } from "next/server";
import { emailUploadSchema } from "@/lib/admin-record-schema";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { saveInquiry } from "@/lib/inquiry-store";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = emailUploadSchema.parse(await request.json());
    const emails = [...new Set(body.emails.split(/[\s,;]+/).map((item) => item.trim().toLowerCase()).filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item)))];
    if (emails.length === 0) return NextResponse.json({ error: "No valid email addresses were found." }, { status: 400 });
    if (emails.length > 200) return NextResponse.json({ error: "Paste 200 addresses or fewer at a time." }, { status: 400 });
    let saved = 0;
    for (const email of emails) {
      const result = await saveInquiry({ type: "newsletter", email, name: "", subject: "Uploaded subscriber" });
      if (!result.ok) return NextResponse.json({ error: "The list could not be saved." }, { status: 503 });
      if (!result.duplicate) saved += 1;
    }
    return NextResponse.json({ message: `Saved ${saved} new subscriber${saved === 1 ? "" : "s"}. ${emails.length - saved} were already stored.`, saved });
  } catch (error) {
    return errorResponse(error);
  }
}
