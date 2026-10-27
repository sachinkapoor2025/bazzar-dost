import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <h1 className="font-display text-4xl">Orders</h1>
      <table className="mt-4 w-full text-left text-sm">
        <thead><tr className="border-b border-cream-300"><th className="py-2">Order</th><th>Customer</th><th>Status</th><th>Payment</th><th>Total</th></tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-cream-200">
              <td className="py-2"><Link className="font-semibold underline" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link><span className="block text-xs text-muted">{formatDate(order.createdAt)}</span></td>
              <td>{order.name}<span className="block text-xs">{order.email}</span></td>
              <td className="capitalize">{order.status}</td>
              <td className="capitalize">{order.paymentStatus}</td>
              <td>{formatINR(order.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
