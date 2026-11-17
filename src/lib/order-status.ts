import "server-only";
import { databaseConfigured, prisma } from "@/lib/db";
import { changeLocalStock } from "@/lib/local-catalogue";
import { listLocalOrders, saveLocalOrders } from "@/lib/local-orders";
import { OrderError } from "@/lib/place-order";

export async function updateOrderStatus(id: string, input: { status: string; paymentStatus: string; trackingNote: string }) {
  if (!databaseConfigured()) {
    const orders = listLocalOrders();
    const order = orders.find((item) => item.id === id);
    if (!order) throw new OrderError("Order not found.", 404);
    if (order.status === "cancelled" && input.status !== "cancelled") {
      throw new OrderError("A cancelled order stays cancelled so stock is not changed again.");
    }
    const restore = input.status === "cancelled" && order.status !== "cancelled";
    order.status = input.status;
    order.paymentStatus = input.paymentStatus;
    order.trackingNote = input.trackingNote;
    order.updatedAt = new Date().toISOString();
    if (!saveLocalOrders(orders)) throw new OrderError("The order cannot be saved right now.", 503);
    if (restore) {
      for (const item of order.items) {
        if (item.productId) changeLocalStock(item.productId, item.variantId, item.qty);
      }
    }
    return order;
  }
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
