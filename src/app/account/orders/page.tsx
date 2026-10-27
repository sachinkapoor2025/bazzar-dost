import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Order history", robots: { index: false, follow: false } };

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/orders");
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="font-display text-4xl">Order history</h1>
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
                <td className="capitalize">{order.status}</td>
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
