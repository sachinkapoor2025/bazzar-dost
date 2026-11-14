import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const customer = await prisma.user.findUnique({
    where: { id: (await params).id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      addresses: true,
      orders: { orderBy: { createdAt: "desc" }, include: { items: true } },
    },
  });
  if (!customer || customer.role === "admin") notFound();
  const spent = customer.orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0);
  return (
    <div>
      <p className="text-sm"><Link className="underline" href="/admin/customers">Customers</Link></p>
      <h1 className="mt-2 font-display text-4xl">{customer.name}</h1>
      <p className="mt-2 text-sm">{customer.email}{customer.phone ? ` · ${customer.phone}` : ""} · Joined {formatDate(customer.createdAt)}</p>
      <p className="mt-1 text-sm">{customer.orders.length} orders · {formatINR(spent)} spent, excluding cancelled orders</p>
      <h2 className="mt-6 font-display text-2xl">Addresses</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {customer.addresses.length === 0 ? <li>No saved address.</li> : customer.addresses.map((address) => (
          <li key={address.id}>{address.fullName}, {address.line1}, {address.city}, {address.state} {address.pincode}</li>
        ))}
      </ul>
      <h2 className="mt-6 font-display text-2xl">Orders</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {customer.orders.map((order) => (
          <li key={order.id}>
            <Link className="font-semibold underline" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
            {" "}· {order.status} · {formatINR(order.total)} · {order.items.map((item) => `${item.name} × ${item.qty}`).join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
