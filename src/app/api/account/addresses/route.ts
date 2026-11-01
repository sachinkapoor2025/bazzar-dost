import { NextResponse } from "next/server";
import { api } from "@/lib/backend";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { addressSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = addressSchema.parse(await request.json());
    const addresses = await api("/account/addresses", { body });
    return NextResponse.json({ addresses });
  } catch (error) {
    return errorResponse(error);
  }
}
