import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";

export default async function AdminHomePage() {
  const [products, orders, inquiries, lowStock] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.inquiry.count({ where: { status: "new", type: { not: "newsletter" } } }),
    prisma.product.count({ where: { isActive: true, variants: { none: {} }, stock: { lte: 5 } } }),
  ]);
  const recent = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 });
  return (
    <div>
      <h1 className="font-display text-4xl">Store admin</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Prices, stock, discounts, and orders on this screen are the live catalogue records, including any starter products created by the seed. Edit them before treating the shop as your own inventory. Archiving a product hides it. Orders are not deleted here.</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Products", products],
          ["Orders", orders],
          ["New enquiries", inquiries],
          ["Low stock", lowStock],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl bg-white p-4">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="font-display text-3xl">{value}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-6 font-display text-2xl">Recent orders</h2>
      <ul className="mt-2 text-sm">
        {recent.map((order) => (
          <li key={order.id}><Link className="underline" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link> · {order.status} · {formatINR(order.total)}</li>
        ))}
      </ul>
    </div>
  );
}
