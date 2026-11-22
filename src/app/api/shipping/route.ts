import { NextResponse } from "next/server";
import { loadShippingPricing } from "@/lib/shipping-settings";

export async function GET() {
  const pricing = await loadShippingPricing();
  return NextResponse.json(pricing);
}
