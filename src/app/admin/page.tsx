import Link from "next/link";
import { AdminRangeForm } from "@/components/admin-range-form";
import { loadVisitReport } from "@/lib/admin-insights";
import { loadAdminOverview } from "@/lib/admin-stats";
import { formatINR } from "@/lib/format";
import { orderStatusLabel } from "@/lib/order-progress";

export default async function AdminHomePage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const params = await searchParams;
  const [data, visits] = await Promise.all([loadAdminOverview(params), loadVisitReport(params)]);
  const peak = Math.max(1, ...data.days.map((day) => day.revenue));
  return (
    <div>
      <h1 className="font-display text-4xl">Dashboard</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Figures come from orders, products, customer accounts, and page visits stored for BazaarDost. Revenue excludes cancelled orders. Checkout is cash on delivery.</p>
      <div className="mt-4">
        <AdminRangeForm range={data.range} from={params.from} to={params.to} />
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Orders", data.totals.orders, "/admin/orders"],
          ["Revenue", formatINR(data.totals.revenue), "/admin/reports"],
          ["Products", data.totals.products, "/admin/products"],
          ["Customers", data.totals.customers, "/admin/customers"],
          ["Pending", data.totals.pending, "/admin/orders"],
          ["Delivered", data.totals.completed, "/admin/orders?status=delivered"],
          ["Cancelled", data.totals.cancelled, "/admin/orders?status=cancelled"],
          ["Low stock", data.totals.lowStock, "/admin/inventory"],
          ["Page views", visits.views, "/admin/analytics?tab=visitor-analytics"],
          ["Visitors", visits.visitors, "/admin/analytics?tab=sessions"],
        ].map(([label, value, href]) => (
          <Link key={String(label)} href={String(href)} className="rounded-xl border border-cream-300 bg-white p-5 transition hover:border-forest-800">
            <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-bold text-forest-900">{value}</dd>
          </Link>
        ))}
      </dl>
      <section className="mt-6 rounded-2xl bg-white p-4">
        <h2 className="font-display text-2xl"><Link className="underline" href="/admin/reports">Revenue</Link></h2>
        <div className="mt-3 flex h-40 items-end gap-1 overflow-x-auto">
          {data.days.map((day) => (
            <div key={day.day} className="flex min-w-3 flex-1 flex-col items-center justify-end" title={`${day.day}: ${formatINR(day.revenue)}`}>
              <div className="w-full rounded-t bg-forest-800" style={{ height: `${Math.max(4, (day.revenue / peak) * 100)}%` }} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">{data.days[0]?.day} to {data.days[data.days.length - 1]?.day}</p>
      </section>
      <section className="mt-6 rounded-2xl bg-white p-4">
        <h2 className="font-display text-2xl">Order status</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {data.statusCounts.map((item) => (
            <li key={item.status}>
              <Link href={`/admin/orders?status=${item.status}`} className="flex items-center justify-between rounded-xl bg-cream-100 px-3 py-2 text-sm hover:bg-cream-200">
                <span>{orderStatusLabel(item.status)}</span><strong>{item.count}</strong>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl">Recent orders</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {data.recentOrders.length === 0 ? <li>No orders yet.</li> : data.recentOrders.map((order) => (
              <li key={order.id}><Link className="font-semibold underline" href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link> · {order.name} · {orderStatusLabel(order.status)} · {formatINR(order.total)}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl">Recent customers</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {data.recentCustomers.length === 0 ? <li>No customer accounts yet.</li> : data.recentCustomers.map((customer) => (
              <li key={customer.id}><Link className="font-semibold underline" href={`/admin/customers/${customer.id}`}>{customer.name}</Link> · {customer.email} · {customer._count.orders} orders</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl">Best sellers</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {data.bestSellers.length === 0 ? <li>No completed sales in this period.</li> : data.bestSellers.map((item) => (
              <li key={`${item.productId}-${item.name}`}>{item.productId ? <Link className="underline" href={`/admin/products/${item.productId}`}>{item.name}</Link> : item.name} · {item.qty} sold</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl">Low stock</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {data.lowStock.length === 0 ? <li>No active product is at 5 or below.</li> : data.lowStock.map((product) => (
              <li key={product.id}><Link className="underline" href={`/admin/products/${product.id}`}>{product.name}</Link> · {product.sku} · {product.stock}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
