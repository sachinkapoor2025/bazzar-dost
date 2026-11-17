import { NextResponse } from "next/server";
import { createAddress } from "@/lib/address-store";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { addressSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = addressSchema.parse(await request.json());
    const addresses = await createAddress(user.id, body);
    if (!addresses) return NextResponse.json({ error: "The address cannot be saved right now." }, { status: 503 });
    return NextResponse.json({ addresses });
  } catch (error) {
    return errorResponse(error);
  }
}
