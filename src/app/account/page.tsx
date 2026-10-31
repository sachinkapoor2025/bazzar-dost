import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "My account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 });
  return (
    <div>
      <h1 className="font-display text-4xl">My account</h1>
      <p className="mt-2 text-sm text-muted">Orders placed while you are signed in appear here. Guest orders can be opened with the confirmation link or the tracking form.</p>
      <h2 className="mt-6 font-display text-2xl">Recent orders</h2>
      {orders.length === 0 ? <p className="mt-2 text-sm">No orders yet. <Link href="/shop" className="underline">Start shopping</Link></p> : (
        <ul className="mt-3 divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <Link href={`/account/orders/${order.orderNumber}`} className="font-semibold">{order.orderNumber}</Link>
              <span>{formatDate(order.createdAt)}</span>
              <span className="capitalize">{order.status}</span>
              <span>{formatINR(order.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
