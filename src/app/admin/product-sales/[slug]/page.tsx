import Link from "next/link";
import { notFound } from "next/navigation";
import { databaseHasOrders, readDatabase } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";
import { localProduct } from "@/lib/local-catalogue";
import { listLocalOrders } from "@/lib/local-orders";

export default async function ProductSaleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const stored = await readDatabase(null, (client) => client.product.findUnique({ where: { slug }, select: { id: true, name: true, sku: true, slug: true } }));
  const local = stored ? null : localProduct(slug);
  const product = stored || (local ? { id: local.id, name: local.name, sku: local.sku, slug: local.slug } : null);
  if (!product) notFound();
  const orders = (await databaseHasOrders())
    ? await readDatabase([], (client) => client.order.findMany({
        where: { items: { some: { productId: product.id } }, status: { not: "cancelled" } },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { id: true, orderNumber: true, createdAt: true, name: true, total: true, items: { where: { productId: product.id }, select: { qty: true, unitPrice: true } } },
      }))
    : listLocalOrders().filter((order) => order.status !== "cancelled" && order.items.some((item) => item.productId === product.id)).slice(0, 100).map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: new Date(order.createdAt),
        name: order.name,
        total: order.total,
        items: order.items.filter((item) => item.productId === product.id).map((item) => ({ qty: item.qty, unitPrice: item.unitPrice })),
      }));
  return (
    <div>
      <p className="text-sm"><Link className="underline" href="/admin/product-sales">Product sales</Link></p>
      <h1 className="mt-2 font-display text-4xl">{product.name}</h1>
      <p className="mt-2 text-sm text-muted">{product.sku}</p>
      <div className="mt-4 max-w-full overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead><tr className="border-b border-cream-300"><th className="py-2">Order</th><th>Customer</th><th>Qty</th><th>Line total</th></tr></thead>
          <tbody>
            {orders.length === 0 ? <tr><td className="py-3 text-muted" colSpan={4}>No completed sales for this product.</td></tr> : orders.map((order) => {
              const qty = order.items.reduce((sum, item) => sum + item.qty, 0);
              const line = order.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
              return (
                <tr key={order.id} className="border-b border-cream-200">
                  <td className="py-2"><Link className="font-semibold underline" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link><span className="block text-xs text-muted">{formatDate(order.createdAt)}</span></td>
                  <td>{order.name}</td>
                  <td>{qty}</td>
                  <td>{formatINR(line)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
