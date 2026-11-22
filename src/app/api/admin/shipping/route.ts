import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { loadShippingSettings, saveShippingSettings } from "@/lib/shipping-settings";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ settings: await loadShippingSettings() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const settings = await saveShippingSettings(await request.json());
    return NextResponse.json({ settings, message: "Shipping settings saved." });
  } catch (error) {
    return errorResponse(error);
  }
}
