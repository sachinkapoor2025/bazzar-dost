import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin-managers";
import { OrderDetail, toOrderView } from "@/components/order-detail";
import { prisma } from "@/lib/db";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await prisma.order.findUnique({ where: { id: (await params).id }, include: { items: true } });
  if (!order) notFound();
  return (
    <div>
      <OrderDetail order={toOrderView(order)} />
      <OrderStatusForm id={order.id} status={order.status} paymentStatus={order.paymentStatus} trackingNote={order.trackingNote} />
    </div>
  );
}
