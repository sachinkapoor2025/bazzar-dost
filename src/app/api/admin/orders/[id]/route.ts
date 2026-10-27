import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/http";
import { updateOrderStatus } from "@/lib/order-status";
import { orderUpdateSchema } from "@/lib/validators";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = orderUpdateSchema.parse(await request.json());
    await updateOrderStatus(id, body);
    return NextResponse.json({ message: "Order updated." });
  } catch (error) {
    return errorResponse(error);
  }
}
