import { NextResponse } from "next/server";
import { deleteRecord, updateRecord } from "@/lib/admin-records";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const record = await updateRecord(id, await request.json());
    return NextResponse.json({ id: record.id, message: "Updated." });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    await deleteRecord((await context.params).id);
    return NextResponse.json({ message: "Deleted." });
  } catch (error) {
    return errorResponse(error);
  }
}
