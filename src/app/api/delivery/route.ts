import { NextResponse } from "next/server";
import { checkPincode } from "@/lib/delivery";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`delivery:${forwarded}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many checks. Please try again in a minute." }, { status: 429 });
  }
  let pincode = "";
  try {
    const body = (await request.json()) as { pincode?: unknown };
    pincode = typeof body.pincode === "string" ? body.pincode : "";
  } catch {
    return NextResponse.json({ error: "Enter a valid 6-digit PIN code." }, { status: 400 });
  }
  const result = checkPincode(pincode);
  if (!result.ok) return NextResponse.json({ error: result.message, available: false, estimate: null }, { status: 400 });
  return NextResponse.json({ available: result.available, estimate: result.estimate, message: result.message });
}
