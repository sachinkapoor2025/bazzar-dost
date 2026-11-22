import Link from "next/link";
import { AdminRangeForm } from "@/components/admin-range-form";
import { loadAdminOverview } from "@/lib/admin-stats";
import { loadOrderRoutes, loadVisitReport } from "@/lib/admin-insights";
import { formatDate, formatINR } from "@/lib/format";
import { orderStatusLabel } from "@/lib/order-progress";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "order-routes", label: "Order routes" },
  { id: "visitor-analytics", label: "Visitor analytics" },
  { id: "live", label: "Live visitor" },
  { id: "sessions", label: "Visitors" },
];

function tabClass(active: boolean) {
  return active ? "rounded-full bg-forest-800 px-3 py-1.5 text-sm font-semibold text-cream-50" : "rounded-full border border-cream-300 bg-white px-3 py-1.5 text-sm font-semibold text-forest-900";
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ tab?: string; range?: string; from?: string; to?: string; q?: string }> }) {
  const params = await searchParams;
  const tab = tabs.some((item) => item.id === params.tab) ? params.tab! : "overview";
  return (
    <div>
      <h1 className="font-display text-4xl">Analytics</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Figures come from stored orders, product views, and page visits recorded on this shop. A visit is saved when someone opens a public page in the browser.</p>
      <nav className="mt-4 flex flex-wrap gap-2" aria-label="Analytics sections">
        {tabs.map((item) => <Link key={item.id} href={`/admin/analytics?tab=${item.id}`} className={tabClass(tab === item.id)}>{item.label}</Link>)}
        <Link href="/admin/product-sales" className={tabClass(false)}>Product sales</Link>
        <Link href="/admin/seo" className={tabClass(false)}>SEO keywords</Link>
      </nav>
      <div className="mt-6">
        {tab === "overview" ? <Overview params={params} /> : null}
        {tab === "order-routes" ? <Routes /> : null}
        {tab === "visitor-analytics" ? <VisitorAnalytics /> : null}
        {tab === "live" ? <LiveVisitors /> : null}
        {tab === "sessions" ? <Sessions query={params.q || ""} /> : null}
      </div>
    </div>
  );
}

async function Overview({ params }: { params: { range?: string; from?: string; to?: string } }) {
  const data = await loadAdminOverview(params);
  return (
    <div>
      <AdminRangeForm range={data.range} from={params.from} to={params.to} action="/admin/analytics" />
      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Orders", data.totals.orders],
          ["Revenue", formatINR(data.totals.revenue)],
          ["Customers", data.totals.customers],
          ["Low stock", data.totals.lowStock],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-cream-300 bg-white p-4">
            <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {data.statusCounts.map((item) => (
          <li key={item.status} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
            <span>{orderStatusLabel(item.status)}</span><strong>{item.count}</strong>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm"><Link className="font-semibold underline" href="/admin/reports">Open the full report</Link></p>
    </div>
  );
}

async function Routes() {
  const rows = await loadOrderRoutes();
  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead><tr className="border-b border-cream-300"><th className="py-2">State</th><th>City</th><th>Orders</th><th>Revenue</th></tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td className="py-3 text-muted" colSpan={4}>No orders yet.</td></tr> : rows.map((row) => (
            <tr key={`${row.state}-${row.city}`} className="border-b border-cream-200">
              <td className="py-2">{row.state}</td><td>{row.city}</td><td>{row.orders}</td><td>{formatINR(row.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function VisitorAnalytics() {
  const report = await loadVisitReport();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h2 className="font-display text-2xl">Pages</h2>
        <p className="mt-1 text-sm text-muted">{report.total} page views stored.</p>
        <ul className="mt-3 divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white text-sm">
          {report.byPath.length === 0 ? <li className="px-3 py-2 text-muted">No page views yet.</li> : report.byPath.slice(0, 20).map((row) => (
            <li key={row.path} className="flex justify-between px-3 py-2"><span>{row.path}</span><strong>{row.count}</strong></li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-display text-2xl">Devices</h2>
        <ul className="mt-3 divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white text-sm">
          {report.byDevice.length === 0 ? <li className="px-3 py-2 text-muted">No device data yet.</li> : report.byDevice.map((row) => (
            <li key={row.device} className="flex justify-between px-3 py-2 capitalize"><span>{row.device}</span><strong>{row.count}</strong></li>
          ))}
        </ul>
      </section>
    </div>
  );
}

async function LiveVisitors() {
  const report = await loadVisitReport();
  return (
    <div>
      <p className="text-sm text-muted">{report.live.length} session{report.live.length === 1 ? "" : "s"} seen in the last 15 minutes.</p>
      <ul className="mt-3 divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white text-sm">
        {report.live.length === 0 ? <li className="px-3 py-2 text-muted">Nobody is active in that window.</li> : report.live.map((session) => (
          <li key={session.sessionId} className="px-3 py-2">
            <span className="font-semibold">{session.lastPath}</span>
            <span className="block text-xs text-muted">{session.device} · {session.views} views · {formatDate(session.lastAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function Sessions({ query }: { query: string }) {
  const report = await loadVisitReport();
  const needle = query.trim().toLowerCase();
  const rows = needle ? report.sessions.filter((session) => session.lastPath.toLowerCase().includes(needle) || session.sessionId.toLowerCase().includes(needle)) : report.sessions;
  return (
    <div>
      <form action="/admin/analytics" className="mb-3 flex gap-2">
        <input type="hidden" name="tab" value="sessions" />
        <input name="q" defaultValue={query} placeholder="Search path or session" className="min-h-11 w-full max-w-sm rounded-full border border-cream-300 bg-white px-4 text-sm" />
        <button className="min-h-11 rounded-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Search</button>
      </form>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead><tr className="border-b border-cream-300"><th className="py-2">Last page</th><th>Device</th><th>Views</th><th>Last seen</th></tr></thead>
          <tbody>
            {rows.slice(0, 100).length === 0 ? <tr><td className="py-3 text-muted" colSpan={4}>No visitors stored yet.</td></tr> : rows.slice(0, 100).map((session) => (
              <tr key={session.sessionId} className="border-b border-cream-200">
                <td className="py-2">{session.lastPath}</td>
                <td className="capitalize">{session.device}</td>
                <td>{session.views}</td>
                <td>{formatDate(session.lastAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
