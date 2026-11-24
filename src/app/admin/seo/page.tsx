import Link from "next/link";
import { RecordManager } from "@/components/record-manager";
import { listRecords } from "@/lib/admin-records";
import { loadProductSales } from "@/lib/admin-insights";

export default async function SeoPage() {
  const [records, products] = await Promise.all([listRecords("seo"), loadProductSales()]);
  const rows = records.map((record) => {
    const keyword = record.title.toLowerCase();
    const matches = products.filter((product) => product.name.toLowerCase().includes(keyword) || product.category.toLowerCase().includes(keyword)).length;
    return {
      id: record.id,
      title: record.title,
      status: record.status,
      createdAt: record.createdAt,
      payload: {
        landingPath: String(record.payload.landingPath || ""),
        notes: String(record.payload.notes || ""),
        matches,
      },
    };
  });
  return (
    <div>
      <h1 className="font-display text-4xl">SEO keywords</h1>
      <p className="mb-4 mt-2 max-w-3xl text-sm leading-6 text-muted">Keywords saved here are the ones this shop is tracking. The match count is how many active products or categories contain that phrase. Search Console is not connected, so impressions and average position are not shown.</p>
      <ul className="mb-4 divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white text-sm">
        {rows.length === 0 ? <li className="px-3 py-2 text-muted">No keywords yet.</li> : rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
            <span>{row.title}{row.payload.landingPath.startsWith("/") ? <> · <Link className="font-semibold underline" href={row.payload.landingPath}>{row.payload.landingPath}</Link></> : null}</span>
            <span>{row.payload.matches} catalogue matches</span>
          </li>
        ))}
      </ul>
      <RecordManager
        kind="seo"
        noun="keyword"
        statuses={["active", "paused"]}
        rows={rows}
        fields={[
          { name: "landingPath", label: "Landing path" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
