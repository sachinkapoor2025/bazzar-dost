import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin-managers";
import { OrderDetail, toOrderView } from "@/components/order-detail";
import { api } from "@/lib/backend";
import type { OrderView } from "@/components/order-detail";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await api<(Omit<OrderView, "createdAt"> & { id: string; createdAt: string }) | null>(`/admin/orders/${encodeURIComponent((await params).id)}`).catch(() => null);
  if (!order) notFound();
  return (
    <div>
      <OrderDetail order={toOrderView(order)} />
      <OrderStatusForm id={order.id} status={order.status} paymentStatus={order.paymentStatus} trackingNote={order.trackingNote} />
    </div>
  );
}
