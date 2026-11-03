import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";
import type { Prisma } from "@prisma/client";

const statuses = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; from?: string; to?: string }> }) {
  const params = await searchParams;
  const where: Prisma.OrderWhereInput = {};
  if (params.status && statuses.includes(params.status)) where.status = params.status;
  if (params.q) {
    where.OR = [
      { orderNumber: { contains: params.q, mode: "insensitive" } },
      { email: { contains: params.q, mode: "insensitive" } },
      { name: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.from || params.to) {
    where.createdAt = {
      gte: params.from ? new Date(`${params.from}T00:00:00`) : undefined,
      lte: params.to ? new Date(`${params.to}T23:59:59.999`) : undefined,
    };
  }
  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Orders</h1>
        <a className="text-sm font-semibold underline" href="/api/admin/export?type=orders">Export CSV</a>
      </div>
      <p className="mt-2 text-sm text-muted">Placed is the first status after checkout. Refunds are recorded on the payment status, because cash on delivery has no card transaction.</p>
      <form className="mt-4 flex flex-wrap gap-2" action="/admin/orders">
        <input name="q" defaultValue={params.q || ""} placeholder="Order number, name, or email" className="min-h-11 min-w-56 flex-1 rounded-full border border-cream-300 bg-white px-4 text-sm" />
        <select name="status" defaultValue={params.status || ""} className="min-h-11 rounded-full border border-cream-300 bg-white px-3 text-sm">
          <option value="">Any status</option>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <input type="date" name="from" defaultValue={params.from || ""} className="min-h-11 rounded-xl border border-cream-300 bg-white px-2 text-sm" />
        <input type="date" name="to" defaultValue={params.to || ""} className="min-h-11 rounded-xl border border-cream-300 bg-white px-2 text-sm" />
        <button className="min-h-11 rounded-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Filter</button>
      </form>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead><tr className="border-b border-cream-300"><th className="py-2">Order</th><th>Customer</th><th>Status</th><th>Payment</th><th>Total</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-cream-200">
                <td className="py-2"><Link className="font-semibold underline" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link><span className="block text-xs text-muted">{formatDate(order.createdAt)}</span></td>
                <td>{order.name}<span className="block text-xs">{order.email}</span></td>
                <td className="capitalize">{order.status}</td>
                <td className="capitalize">{order.paymentMethod} · {order.paymentStatus}</td>
                <td>{formatINR(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 ? <p className="mt-3 text-sm">No orders match.</p> : null}
    </div>
  );
}
