import { NextResponse } from "next/server";
import { deleteAddress } from "@/lib/address-store";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const result = await deleteAddress(user.id, id);
    if (!result.found) return NextResponse.json({ error: "Address not found." }, { status: 404 });
    return NextResponse.json({ addresses: result.addresses });
  } catch (error) {
    return errorResponse(error);
  }
}
