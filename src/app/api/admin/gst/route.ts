import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { loadGstSettings, saveGstSettings } from "@/lib/shipping-settings";

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const settings = await saveGstSettings(await request.json());
    return NextResponse.json({ settings, message: "GST settings saved." });
  } catch (error) {
    return errorResponse(error);
  }
}
