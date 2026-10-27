import "server-only";
import { prisma } from "@/lib/db";
import { OrderError } from "@/lib/place-order";

export async function updateOrderStatus(id: string, input: { status: string; paymentStatus: string; trackingNote: string }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new OrderError("Order not found.", 404);
    if (order.status === "cancelled" && input.status !== "cancelled") {
      throw new OrderError("A cancelled order stays cancelled so stock is not changed again.");
    }
    if (input.status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        if (item.variantId) {
          const updated = await tx.variant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.qty } } });
          if (updated.count !== 1 && item.productId) {
            await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.qty } } });
          }
        } else if (item.productId) {
          await tx.product.updateMany({ where: { id: item.productId }, data: { stock: { increment: item.qty } } });
        }
      }
    }
    return tx.order.update({
      where: { id },
      data: { status: input.status, paymentStatus: input.paymentStatus, trackingNote: input.trackingNote },
    });
  });
}
