import { NextResponse } from "next/server";
import { z } from "zod";
import { queryCatalog } from "@/lib/catalog";
import { errorResponse } from "@/lib/http";

const shopQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  min: z.number().int().min(0).max(9_999_999).optional(),
  max: z.number().int().min(0).max(9_999_999).optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "popular", "name"]).optional(),
  page: z.number().int().min(1).max(500).optional(),
  dealsOnly: z.boolean().optional(),
  wholesaleOnly: z.boolean().optional(),
  arrivalsOnly: z.boolean().optional(),
  bestSellersOnly: z.boolean().optional(),
  inStockOnly: z.boolean().optional(),
  outOfStockOnly: z.boolean().optional(),
  minRating: z.number().int().min(1).max(5).optional(),
});

export async function POST(request: Request) {
  try {
    const input = shopQuerySchema.parse(await request.json());
    const result = await queryCatalog(input);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
