import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim() || "";
  const customers = await prisma.user.findMany({
    where: {
      role: "customer",
      ...(q ? { OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ] } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      orders: { where: { status: { not: "cancelled" } }, select: { total: true } },
      _count: { select: { orders: true } },
    },
  });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Customers</h1>
        <a className="text-sm font-semibold underline" href="/api/admin/export?type=customers">Export CSV</a>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Passwords are never shown. Spending is the total of that customer’s orders, excluding cancelled orders.</p>
      <form className="mt-4" action="/admin/customers">
        <input name="q" defaultValue={q} placeholder="Search name, email, or phone" className="min-h-11 w-full max-w-md rounded-full border border-cream-300 bg-white px-4 text-sm" />
      </form>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead><tr className="border-b border-cream-300"><th className="py-2">Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Spent</th><th>Joined</th></tr></thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-cream-200">
                <td className="py-2"><Link className="font-semibold underline" href={`/admin/customers/${customer.id}`}>{customer.name}</Link></td>
                <td>{customer.email}</td>
                <td>{customer.phone || "—"}</td>
                <td>{customer._count.orders}</td>
                <td>{formatINR(customer.orders.reduce((sum, order) => sum + order.total, 0))}</td>
                <td>{formatDate(customer.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {customers.length === 0 ? <p className="mt-3 text-sm">No customer accounts match.</p> : null}
    </div>
  );
}
