import { NextResponse } from "next/server";
import { visitSchema } from "@/lib/admin-record-schema";
import { recordVisit } from "@/lib/admin-records";
import { errorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { cleanCountry, deviceFromUserAgent } from "@/lib/visit-report";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`visit:${forwarded}`, 120, 60_000)) {
    return NextResponse.json({ error: "Too many visits from this network." }, { status: 429 });
  }
  try {
    const body = visitSchema.parse(await request.json());
    const country = cleanCountry(
      request.headers.get("cloudfront-viewer-country")
      || request.headers.get("cf-ipcountry")
      || request.headers.get("x-vercel-ip-country")
      || request.headers.get("x-country-code"),
    );
    await recordVisit({
      ...body,
      device: deviceFromUserAgent(request.headers.get("user-agent") || "", body.device),
      country,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
