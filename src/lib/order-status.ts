import "server-only";
import { ApiError, api } from "@/lib/backend";
import { OrderError } from "@/lib/place-order";

export async function updateOrderStatus(id: string, input: { status: string; paymentStatus: string; trackingNote: string }) {
  try {
    return await api(`/admin/orders/${encodeURIComponent(id)}`, { method: "PATCH", body: input });
  } catch (error) {
    if (error instanceof ApiError) throw new OrderError(error.message, error.status);
    throw error;
  }
}
