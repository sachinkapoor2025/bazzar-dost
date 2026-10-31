import { NextResponse } from "next/server";
import { productsByIds, productsBySlugs } from "@/lib/catalog";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slugs = (url.searchParams.get("slugs") || "").split(",").map((value) => value.trim()).filter(Boolean).slice(0, 12);
  const ids = (url.searchParams.get("ids") || "").split(",").map((value) => value.trim()).filter(Boolean).slice(0, 50);
  const products = slugs.length ? await productsBySlugs(slugs) : await productsByIds(ids);
  return NextResponse.json({ products });
}
