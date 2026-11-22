import Link from "next/link";
import { notFound } from "next/navigation";
import { databaseConfigured, readDatabase } from "@/lib/db";
import { datedOrder, listLocalOrders } from "@/lib/local-orders";
import { orderStatusLabel } from "@/lib/order-progress";

export default async function OrderRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const order = databaseConfigured()
    ? await readDatabase(null, (client) => client.order.findUnique({
        where: { id },
        select: { id: true, orderNumber: true, status: true, city: true, state: true, pincode: true, addressLine1: true, trackingNote: true },
      }))
    : (() => {
        const stored = listLocalOrders().find((item) => item.id === id);
        return stored ? datedOrder(stored) : null;
      })();
  if (!order) notFound();
  return (
    <div>
      <p className="text-sm"><Link className="underline" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></p>
      <h1 className="mt-2 font-display text-4xl">Order route</h1>
      <dl className="mt-4 grid max-w-xl gap-2 text-sm">
        <div className="rounded-xl bg-white px-3 py-2"><dt className="text-muted">Status</dt><dd>{orderStatusLabel(order.status)}</dd></div>
        <div className="rounded-xl bg-white px-3 py-2"><dt className="text-muted">Address</dt><dd>{order.addressLine1}, {order.city}, {order.state} {order.pincode}</dd></div>
        <div className="rounded-xl bg-white px-3 py-2"><dt className="text-muted">Tracking note</dt><dd>{order.trackingNote || "No tracking note yet."}</dd></div>
      </dl>
    </div>
  );
}
