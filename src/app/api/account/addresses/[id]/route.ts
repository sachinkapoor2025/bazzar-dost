import { NextResponse } from "next/server";
import { api } from "@/lib/backend";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await context.params;
    const addresses = await api(`/account/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
    return NextResponse.json({ addresses });
  } catch (error) {
    return errorResponse(error);
  }
}
