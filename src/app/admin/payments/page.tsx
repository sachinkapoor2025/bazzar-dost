import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const status = (await searchParams).status || "";
  const allowed = ["unpaid", "paid", "refunded"];
  const orders = await prisma.order.findMany({
    where: allowed.includes(status) ? { paymentStatus: status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, orderNumber: true, createdAt: true, paymentMethod: true, paymentStatus: true, total: true, email: true },
  });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Payments</h1>
        <a className="text-sm font-semibold underline" href="/api/admin/export?type=payments">Export CSV</a>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">BazaarDost checkout collects cash on delivery. There is no card gateway, transaction id, or stored card number. Unpaid means the cash has not been marked collected. Refunded means the store recorded a refund after a payment was marked paid. The money movement itself happens outside this website.</p>
      <form className="mt-4" action="/admin/payments">
        <select name="status" defaultValue={status} className="min-h-11 rounded-full border border-cream-300 bg-white px-3 text-sm">
          <option value="">All payment statuses</option>
          {allowed.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button className="ml-2 min-h-11 rounded-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Filter</button>
      </form>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead><tr className="border-b border-cream-300"><th className="py-2">Order</th><th>Method</th><th>Status</th><th>Currency</th><th>Amount</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-cream-200">
                <td className="py-2"><Link className="font-semibold underline" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link><span className="block text-xs text-muted">{formatDate(order.createdAt)} · {order.email}</span></td>
                <td className="uppercase">{order.paymentMethod}</td>
                <td className="capitalize">{order.paymentStatus}</td>
                <td>INR</td>
                <td>{formatINR(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
