import Link from "next/link";
import { StockEditor } from "@/components/stock-editor";
import { prisma } from "@/lib/db";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ stock?: string; q?: string }> }) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const products = await prisma.product.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } : undefined,
    include: { variants: true, category: true },
    orderBy: { name: "asc" },
    take: 200,
  });
  const rows = products.flatMap((product) => {
    if (product.variants.length === 0) {
      return [{ key: product.id, productId: product.id, name: product.name, sku: product.sku, category: product.category.name, stock: product.stock, variantId: undefined as string | undefined }];
    }
    return product.variants.map((variant) => ({
      key: variant.id,
      productId: product.id,
      name: `${product.name} · ${variant.name}`,
      sku: variant.sku,
      category: product.category.name,
      stock: variant.stock,
      variantId: variant.id,
    }));
  }).filter((row) => {
    if (params.stock === "out") return row.stock === 0;
    if (params.stock === "low") return row.stock > 0 && row.stock <= 5;
    return true;
  });
  return (
    <div>
      <h1 className="font-display text-4xl">Inventory</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Stock saved here is the quantity the product page and cart use. A product with options tracks stock on each option.</p>
      <form className="mt-4 flex flex-wrap gap-2" action="/admin/inventory">
        <input name="q" defaultValue={q} placeholder="Search" className="min-h-11 rounded-full border border-cream-300 bg-white px-4 text-sm" />
        <select name="stock" defaultValue={params.stock || ""} className="min-h-11 rounded-full border border-cream-300 bg-white px-3 text-sm">
          <option value="">All stock</option>
          <option value="low">Low, 1 to 5</option>
          <option value="out">Out of stock</option>
        </select>
        <button className="min-h-11 rounded-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Filter</button>
      </form>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead><tr className="border-b border-cream-300"><th className="py-2">Product</th><th>SKU</th><th>Stock</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-cream-200">
                <td className="py-2"><Link className="font-semibold underline" href={`/admin/products/${row.productId}`}>{row.name}</Link><span className="block text-xs text-muted">{row.category}</span></td>
                <td>{row.sku}</td>
                <td><StockEditor productId={row.productId} variantId={row.variantId} stock={row.stock} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <p className="mt-3 text-sm">No inventory rows match.</p> : null}
    </div>
  );
}
