import { NextResponse } from "next/server";
import { z } from "zod";
import { api } from "@/lib/backend";
import { errorResponse } from "@/lib/http";
import { localQuote } from "@/lib/local-catalogue";
import { cartItemSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = z.object({ items: z.array(cartItemSchema).max(30) }).parse(await request.json());
    if (!process.env.API_URL && !process.env.NEXT_PUBLIC_API_URL) {
      return NextResponse.json({ lines: localQuote(body.items) });
    }
    return NextResponse.json(await api("/cart/quote", { body }));
  } catch (error) {
    return errorResponse(error);
  }
}
