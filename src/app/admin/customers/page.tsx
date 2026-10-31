import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-4xl">Customers</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Account records already in the database. Passwords are not shown, and this page does not delete accounts or orders.</p>
      {customers.length === 0 ? <p className="mt-4 text-sm">No accounts yet.</p> : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-cream-300">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Phone</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Orders</th>
                <th className="py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-cream-200">
                  <td className="py-2 pr-3">{customer.name}</td>
                  <td className="py-2 pr-3">{customer.email}</td>
                  <td className="py-2 pr-3">{customer.phone || "—"}</td>
                  <td className="py-2 pr-3 capitalize">{customer.role}</td>
                  <td className="py-2 pr-3">{customer._count.orders}</td>
                  <td className="py-2">{formatDate(customer.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
