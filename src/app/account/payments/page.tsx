import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readDatabase } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Payment methods", robots: { index: false, follow: false } };

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/payments");
  const orders = await readDatabase([], (client) => client.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, orderNumber: true, createdAt: true, paymentMethod: true, paymentStatus: true, total: true },
  }));
  return (
    <div>
      <h2 className="font-display text-3xl text-forest-900">Payment methods</h2>
      <p className="mt-2 max-w-3xl text-base leading-7 text-muted">Checkout is cash on delivery. Card numbers are not collected or stored. An order stays unpaid until the store records that the cash was collected.</p>
      {orders.length === 0 ? <p className="mt-4 text-sm">No payments are recorded on this account yet. <Link href="/shop" className="underline">Start shopping</Link></p> : (
        <ul className="mt-4 divide-y divide-cream-200 rounded-2xl border border-cream-300">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <Link href={`/account/orders/${order.orderNumber}`} className="font-semibold underline">{order.orderNumber}</Link>
              <span>{formatDate(order.createdAt)}</span>
              <span className="uppercase">{order.paymentMethod}</span>
              <span className="capitalize">{order.paymentStatus}</span>
              <span>{formatINR(order.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
