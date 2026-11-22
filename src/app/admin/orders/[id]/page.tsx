import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin-managers";
import { OrderDetail, toOrderView } from "@/components/order-detail";
import { databaseConfigured, readDatabase } from "@/lib/db";
import { datedOrder, listLocalOrders } from "@/lib/local-orders";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const order = databaseConfigured()
    ? await readDatabase(null, (client) => client.order.findUnique({ where: { id }, include: { items: true } }))
    : (() => {
        const stored = listLocalOrders().find((item) => item.id === id);
        return stored ? datedOrder(stored) : null;
      })();
  if (!order) notFound();
  return (
    <div>
      <p className="mb-3 text-sm"><Link className="font-semibold underline" href={`/admin/orders/${order.id}/route`}>Order route</Link></p>
      <OrderDetail order={toOrderView(order)} />
      <OrderStatusForm id={order.id} status={order.status} paymentStatus={order.paymentStatus} trackingNote={order.trackingNote} />
    </div>
  );
}
