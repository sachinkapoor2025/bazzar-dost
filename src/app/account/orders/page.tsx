import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { api } from "@/lib/backend";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatINR } from "@/lib/format";
import { orderStatusLabel } from "@/lib/order-progress";

export const metadata: Metadata = { title: "Order history", robots: { index: false, follow: false } };

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/orders");
  const orders = await api<Array<{ id: string; orderNumber: string; createdAt: string; status: string; paymentStatus: string; total: number }>>("/account/orders");
  return (
    <div>
      <h1 className="font-display text-4xl">Order history</h1>
      <p className="mt-2 max-w-3xl text-base leading-7 text-muted">These are the orders placed while this account was signed in. Open an order number to see its items and status. Guest orders stay on the tracking page.</p>
      {orders.length === 0 ? <p className="mt-3 text-sm">You have not placed an order on this account.</p> : (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-cream-300">
              <th className="py-2">Order</th>
              <th>Placed</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-cream-200">
                <td className="py-2"><Link className="font-semibold underline" href={`/account/orders/${order.orderNumber}`}>{order.orderNumber}</Link></td>
                <td>{formatDate(order.createdAt)}</td>
                <td>{orderStatusLabel(order.status)}</td>
                <td className="capitalize">{order.paymentStatus}</td>
                <td>{formatINR(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
