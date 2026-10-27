import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ include: { category: true, variants: true }, orderBy: { name: "asc" } });
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Products</h1>
        <Link href="/admin/products/new" className="rounded-full bg-forest-800 px-4 py-2 text-sm font-semibold text-cream-50">Add product</Link>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-cream-300"><th className="py-2">Name</th><th>Price</th><th>Stock</th><th>Active</th></tr></thead>
          <tbody>
            {products.map((product) => {
              const stock = product.variants.length ? product.variants.reduce((sum, variant) => sum + variant.stock, 0) : product.stock;
              return (
                <tr key={product.id} className="border-b border-cream-200">
                  <td className="py-2"><Link className="font-semibold underline" href={`/admin/products/${product.id}`}>{product.name}</Link><span className="block text-xs text-muted">{product.category.name}</span></td>
                  <td>{formatINR(product.price)}{product.compareAtPrice ? ` / ${formatINR(product.compareAtPrice)}` : ""}</td>
                  <td>{stock}</td>
                  <td>{product.isActive ? "Yes" : "Hidden"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
