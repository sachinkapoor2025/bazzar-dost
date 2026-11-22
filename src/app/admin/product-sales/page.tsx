import Link from "next/link";
import { loadProductSales } from "@/lib/admin-insights";
import { formatINR } from "@/lib/format";

export default async function ProductSalesPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const page = Math.max(1, Number(params.page) || 1);
  const rows = await loadProductSales(q);
  const pageSize = 24;
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const visible = rows.slice((page - 1) * pageSize, page * pageSize);
  const query = q ? `&q=${encodeURIComponent(q)}` : "";
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Product sales</h1>
        <a className="text-sm font-semibold underline" href="/api/admin/export?type=product-sales">Export CSV</a>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Units and revenue count order lines that were not cancelled. Views come from product page counts stored for this shop.</p>
      <form action="/admin/product-sales" className="mt-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search name, SKU, or category" className="min-h-11 w-full max-w-md rounded-full border border-cream-300 bg-white px-4 text-sm" />
        <button className="min-h-11 rounded-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Search</button>
      </form>
      <div className="mt-4 max-w-full overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead><tr className="border-b border-cream-300"><th className="py-2">Product</th><th>Category</th><th>Stock</th><th>Views</th><th>Sold</th><th>Revenue</th></tr></thead>
          <tbody>
            {visible.length === 0 ? <tr><td className="py-3 text-muted" colSpan={6}>No products match.</td></tr> : visible.map((row) => (
              <tr key={row.slug} className="border-b border-cream-200">
                <td className="py-2"><Link className="font-semibold underline" href={`/admin/product-sales/${row.slug}`}>{row.name}</Link><span className="block text-xs text-muted">{row.sku}</span></td>
                <td>{row.category}</td>
                <td>{row.stock}</td>
                <td>{row.views}</td>
                <td>{row.qty}</td>
                <td>{formatINR(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex gap-3 text-sm">
        {page > 1 ? <Link className="font-semibold underline" href={`/admin/product-sales?page=${page - 1}${query}`}>Previous</Link> : null}
        <span>Page {Math.min(page, pages)} of {pages}</span>
        {page < pages ? <Link className="font-semibold underline" href={`/admin/product-sales?page=${page + 1}${query}`}>Next</Link> : null}
      </p>
    </div>
  );
}
