import Link from "next/link";
import { ProductBulkTable } from "@/components/product-bulk-table";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const pageSize = 24;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const page = Math.max(1, Number(params.page) || 1);
  const filters: Prisma.ProductWhereInput[] = [];
  if (q) {
    filters.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (params.category) filters.push({ category: { slug: params.category } });
  if (params.active === "yes") filters.push({ isActive: true });
  if (params.active === "no") filters.push({ isActive: false });
  if (params.stock === "out") filters.push({ variants: { none: {} }, stock: 0 });
  if (params.stock === "low") {
    filters.push({
      OR: [
        { variants: { none: {} }, stock: { gt: 0, lte: 5 } },
        { variants: { some: { stock: { gt: 0, lte: 5 } } } },
      ],
    });
  }
  const where: Prisma.ProductWhereInput = filters.length ? { AND: filters } : {};
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price-asc" ? { price: "asc" }
      : params.sort === "price-desc" ? { price: "desc" }
        : params.sort === "stock" ? { stock: "asc" }
          : params.sort === "newest" ? { createdAt: "desc" }
            : { name: "asc" };
  const [categories, total, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: true, variants: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value && key !== "page") query.set(key, value);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Products</h1>
        <Link href="/admin/products/new" className="rounded-full bg-forest-800 px-4 py-2 text-sm font-semibold text-cream-50">Add product</Link>
      </div>
      <form className="mt-4 grid gap-2 rounded-2xl bg-white p-3 md:grid-cols-5" action="/admin/products">
        <input name="q" defaultValue={q} placeholder="Search name or SKU" className="min-h-11 rounded-xl border border-cream-300 px-3 text-sm md:col-span-2" />
        <select name="category" defaultValue={params.category || ""} className="min-h-11 rounded-xl border border-cream-300 px-3 text-sm">
          <option value="">All categories</option>
          {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
        </select>
        <select name="active" defaultValue={params.active || ""} className="min-h-11 rounded-xl border border-cream-300 px-3 text-sm">
          <option value="">Any status</option>
          <option value="yes">Active</option>
          <option value="no">Inactive</option>
        </select>
        <select name="sort" defaultValue={params.sort || "name"} className="min-h-11 rounded-xl border border-cream-300 px-3 text-sm">
          <option value="name">Name</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price, low to high</option>
          <option value="price-desc">Price, high to low</option>
          <option value="stock">Stock</option>
        </select>
        <select name="stock" defaultValue={params.stock || ""} className="min-h-11 rounded-xl border border-cream-300 px-3 text-sm">
          <option value="">Any stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <button className="min-h-11 rounded-full bg-forest-800 px-4 text-sm font-semibold text-cream-50">Filter</button>
      </form>
      <p className="mt-3 text-sm text-muted">{total} products</p>
      <div className="mt-3">
        <ProductBulkTable rows={products.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          stock: product.variants.length ? product.variants.reduce((sum, variant) => sum + variant.stock, 0) : product.stock,
          active: product.isActive,
        }))} />
      </div>
      <div className="mt-4 flex gap-3 text-sm">
        {page > 1 ? <Link className="underline" href={`/admin/products?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page - 1) })}`}>Previous</Link> : null}
        <span>Page {page} of {pages}</span>
        {page < pages ? <Link className="underline" href={`/admin/products?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page + 1) })}`}>Next</Link> : null}
      </div>
      <p className="mt-6 text-sm"><Link className="font-semibold underline" href="/admin/products/import">Update prices and stock from a CSV</Link></p>
    </div>
  );
}
