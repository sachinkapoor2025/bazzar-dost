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
        {tab === "visitor-analytics" ? <VisitorAnalytics params={params} /> : null}
        {tab === "live" ? <LiveVisitors params={params} /> : null}
        {tab === "sessions" ? <Sessions params={params} /> : null}
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
          ["Orders", data.totals.orders, "/admin/orders"],
          ["Revenue", formatINR(data.totals.revenue), "/admin/reports"],
          ["Customers", data.totals.customers, "/admin/customers"],
          ["Low stock", data.totals.lowStock, "/admin/inventory"],
        ].map(([label, value, href]) => (
          <Link key={String(label)} href={String(href)} className="rounded-xl border border-cream-300 bg-white p-4 transition hover:border-forest-800">
            <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-bold">{value}</dd>
          </Link>
        ))}
      </dl>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {data.statusCounts.map((item) => (
          <li key={item.status}>
            <Link href={`/admin/orders?status=${item.status}`} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm hover:bg-cream-100">
              <span>{orderStatusLabel(item.status)}</span><strong>{item.count}</strong>
            </Link>
          </li>
        ))}
      </ul>
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

function CountList({ title, empty, rows }: { title: string; empty: string; rows: Array<{ key: string; label: string; count: number }> }) {
  return (
    <section>
      <h2 className="font-display text-2xl">{title}</h2>
      <ul className="mt-3 divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white text-sm">
        {rows.length === 0 ? <li className="px-3 py-2 text-muted">{empty}</li> : rows.slice(0, 20).map((row) => (
          <li key={row.key} className="flex justify-between gap-3 px-3 py-2"><span className="break-all">{row.label}</span><strong>{row.count}</strong></li>
        ))}
      </ul>
    </section>
  );
}

async function VisitorAnalytics({ params }: { params: { range?: string; from?: string; to?: string } }) {
  const report = await loadVisitReport(params);
  const peak = Math.max(1, ...report.days.map((day) => day.views));
  return (
    <div>
      <AdminRangeForm range={report.range} from={params.from} to={params.to} action="/admin/analytics" extra={{ tab: "visitor-analytics" }} />
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Counts come from page visits stored for this shop. Location is saved only when the hosting network sends a country code. Direct means the browser did not send a referring page.</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Page views", report.views],
          ["Unique visitors", report.visitors],
          ["Today", report.today.views],
          ["Last 7 days", report.week.views],
          ["Last 30 days", report.month.views],
          ["Unique today", report.today.visitors],
          ["Unique in 7 days", report.week.visitors],
          ["Unique in 30 days", report.month.visitors],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-cream-300 bg-white p-4">
            <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <section className="mt-6 rounded-2xl bg-white p-4">
        <h2 className="font-display text-2xl">Page views by day</h2>
        <div className="mt-3 flex h-40 items-end gap-1 overflow-x-auto">
          {report.days.length === 0 ? <p className="text-sm text-muted">No visits in this range.</p> : report.days.map((day) => (
            <div key={day.day} className="flex min-w-3 flex-1 flex-col items-center justify-end" title={`${day.day}: ${day.views}`}>
              <div className="w-full rounded-t bg-forest-800" style={{ height: `${Math.max(day.views ? 4 : 0, (day.views / peak) * 100)}%` }} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">{report.days[0]?.day} to {report.days[report.days.length - 1]?.day}{report.chartTruncated ? ". The chart shows the latest 62 days." : ""}</p>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CountList title="Pages" empty="No page views in this range." rows={report.byPath.map((row) => ({ key: row.path, label: row.path, count: row.count }))} />
        <CountList title="Devices" empty="No device data in this range." rows={report.byDevice.map((row) => ({ key: row.device, label: row.device, count: row.count }))} />
        <CountList title="Sources" empty="No visits in this range." rows={report.byReferrer.map((row) => ({ key: row.source, label: row.source, count: row.count }))} />
        <CountList title="Countries" empty="No visits in this range." rows={report.byCountry.map((row) => ({ key: row.country, label: row.country, count: row.count }))} />
      </div>
      <section className="mt-6">
        <h2 className="font-display text-2xl">Journeys</h2>
        <ul className="mt-3 divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white text-sm">
          {report.sessions.length === 0 ? <li className="px-3 py-2 text-muted">No journeys in this range.</li> : report.sessions.slice(0, 20).map((session) => (
            <li key={session.sessionId} className="px-3 py-2">
              <p className="break-all">{session.journey.join(" → ")}</p>
              <p className="text-xs text-muted">{session.device} · {session.country} · {session.referrer} · {session.views} views · {formatDate(session.lastAt)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

async function LiveVisitors({ params }: { params: { range?: string; from?: string; to?: string } }) {
  const report = await loadVisitReport(params);
  return (
    <div>
      <AdminRangeForm range={report.range} from={params.from} to={params.to} action="/admin/analytics" extra={{ tab: "live" }} />
      <p className="mt-3 text-sm text-muted">{report.live.length} session{report.live.length === 1 ? "" : "s"} seen in the last 15 minutes.</p>
      <ul className="mt-3 divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white text-sm">
        {report.live.length === 0 ? <li className="px-3 py-2 text-muted">Nobody is active in that window.</li> : report.live.map((session) => (
          <li key={session.sessionId} className="px-3 py-2">
            <span className="font-semibold">{session.lastPath}</span>
            <span className="block text-xs text-muted">{session.device} · {session.country} · {session.referrer} · {session.views} views · {formatDate(session.lastAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function Sessions({ params }: { params: { range?: string; from?: string; to?: string; q?: string } }) {
  const report = await loadVisitReport(params);
  const query = params.q || "";
  const needle = query.trim().toLowerCase();
  const rows = needle ? report.sessions.filter((session) => [session.lastPath, session.sessionId, session.referrer, session.country].some((value) => value.toLowerCase().includes(needle))) : report.sessions;
  return (
    <div>
      <AdminRangeForm range={report.range} from={params.from} to={params.to} action="/admin/analytics" extra={{ tab: "sessions" }} />
      <form action="/admin/analytics" className="mb-3 mt-3 flex gap-2">
        <input type="hidden" name="tab" value="sessions" />
        <input type="hidden" name="range" value={report.range} />
        {params.from ? <input type="hidden" name="from" value={params.from} /> : null}
        {params.to ? <input type="hidden" name="to" value={params.to} /> : null}
        <input name="q" defaultValue={query} placeholder="Search path, source, or country" className="min-h-11 w-full max-w-sm rounded-full border border-cream-300 bg-white px-4 text-sm" />
        <button className="min-h-11 rounded-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Search</button>
      </form>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead><tr className="border-b border-cream-300"><th className="py-2">Last page</th><th>Source</th><th>Country</th><th>Device</th><th>Views</th><th>Last seen</th></tr></thead>
          <tbody>
            {rows.slice(0, 100).length === 0 ? <tr><td className="py-3 text-muted" colSpan={6}>No visitors stored for this range.</td></tr> : rows.slice(0, 100).map((session) => (
              <tr key={session.sessionId} className="border-b border-cream-200">
                <td className="py-2">{session.lastPath}</td>
                <td>{session.referrer}</td>
                <td>{session.country}</td>
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
