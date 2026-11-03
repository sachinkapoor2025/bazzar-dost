import Link from "next/link";
import { AdminRangeForm } from "@/components/admin-range-form";
import { loadAdminOverview } from "@/lib/admin-stats";
import { formatINR } from "@/lib/format";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const params = await searchParams;
  const data = await loadAdminOverview(params);
  return (
    <div>
      <h1 className="font-display text-4xl">Reports</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Sales, orders, products, and payments for the selected dates. Exports download the current stored records.</p>
      <div className="mt-4"><AdminRangeForm range={data.range} from={params.from} to={params.to} action="/admin/reports" /></div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <a className="underline" href="/api/admin/export?type=orders">Orders CSV</a>
        <a className="underline" href="/api/admin/export?type=products">Products CSV</a>
        <a className="underline" href="/api/admin/export?type=payments">Payments CSV</a>
        <a className="underline" href="/api/admin/export?type=customers">Customers CSV</a>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Sales", formatINR(data.totals.revenue)],
          ["Orders", data.totals.orders],
          ["Delivered", data.totals.completed],
          ["Cancelled", data.totals.cancelled],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl bg-white p-4">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="font-display text-3xl">{value}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-6 font-display text-2xl">Daily orders</h2>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-cream-300"><th className="py-2">Date</th><th>Orders</th><th>Revenue</th></tr></thead>
          <tbody>
            {data.days.filter((day) => day.orders > 0).map((day) => (
              <tr key={day.day} className="border-b border-cream-200"><td className="py-2">{day.day}</td><td>{day.orders}</td><td>{formatINR(day.revenue)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="mt-6 font-display text-2xl">Product performance</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {data.bestSellers.length === 0 ? <li>No items sold in this period.</li> : data.bestSellers.map((item) => (
          <li key={`${item.productId}-${item.name}`}>{item.productId ? <Link className="underline" href={`/admin/products/${item.productId}`}>{item.name}</Link> : item.name} · {item.qty} sold</li>
        ))}
      </ul>
      <h2 className="mt-6 font-display text-2xl">Inventory watch</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {data.lowStock.length === 0 ? <li>No low-stock products.</li> : data.lowStock.map((product) => (
          <li key={product.id}><Link className="underline" href={`/admin/inventory`}>{product.name}</Link> · {product.stock} left</li>
        ))}
      </ul>
    </div>
  );
}
