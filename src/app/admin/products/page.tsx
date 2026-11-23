import Link from "next/link";
import { ProductBulkTable } from "@/components/product-bulk-table";
import { databaseHasProducts, readDatabase } from "@/lib/db";
import { listAdminCatalogueProducts } from "@/lib/local-catalogue";
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
  const usingCatalogue = !(await databaseHasProducts());
  if (usingCatalogue) {
    const listed = listAdminCatalogueProducts({
      q,
      category: params.category,
      active: params.active,
      stock: params.stock,
      sort: params.sort,
      page,
      pageSize,
    });
    const pages = Math.max(1, Math.ceil(listed.total / pageSize));
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value && key !== "page") query.set(key, value);
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl">Products</h1>
          <Link href="/admin/products/new" className="rounded-full bg-forest-800 px-4 py-2 text-sm font-semibold text-cream-50">Add product</Link>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">These are the products currently shown on the shop. Search, category, stock, and price filters apply to that same catalogue.</p>
        <ProductFilters params={params} q={q} categories={listed.categories} />
        <p className="mt-3 text-sm text-muted">{listed.total} products</p>
        <div className="mt-3">
          <ProductBulkTable rows={listed.products} />
        </div>
        <ProductPager page={page} pages={pages} query={query} />
        <p className="mt-6 text-sm"><Link className="font-semibold underline" href="/admin/products/import">Update prices and stock from a CSV</Link></p>
      </div>
    );
  }
  const where: Prisma.ProductWhereInput = filters.length ? { AND: filters } : {};
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price-asc" ? { price: "asc" }
      : params.sort === "price-desc" ? { price: "desc" }
        : params.sort === "stock" ? { stock: "asc" }
          : params.sort === "newest" ? { createdAt: "desc" }
            : { name: "asc" };
  const [categories, total, products] = await readDatabase([[], 0, []] as const, (client) => Promise.all([
    client.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    client.product.count({ where }),
    client.product.findMany({
      where,
      include: { category: true, variants: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]));
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value && key !== "page") query.set(key, value);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Products</h1>
        <Link href="/admin/products/new" className="rounded-full bg-forest-800 px-4 py-2 text-sm font-semibold text-cream-50">Add product</Link>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Active products are the ones shoppers can open. Editing a product changes the name, price, stock, and description shown on the storefront. Hidden products stay out of search and department lists.</p>
      <ProductFilters params={params} q={q} categories={categories} />
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
      <ProductPager page={page} pages={pages} query={query} />
      <p className="mt-6 text-sm"><Link className="font-semibold underline" href="/admin/products/import">Update prices and stock from a CSV</Link></p>
    </div>
  );
}

function ProductFilters({
  params,
  q,
  categories,
}: {
  params: Record<string, string | undefined>;
  q: string;
  categories: Array<{ slug: string; name: string }>;
}) {
  return (
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
  );
}

function ProductPager({ page, pages, query }: { page: number; pages: number; query: URLSearchParams }) {
  return (
    <div className="mt-4 flex gap-3 text-sm">
      {page > 1 ? <Link className="underline" href={`/admin/products?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page - 1) })}`}>Previous</Link> : null}
      <span>Page {page} of {pages}</span>
      {page < pages ? <Link className="underline" href={`/admin/products?${new URLSearchParams({ ...Object.fromEntries(query), page: String(page + 1) })}`}>Next</Link> : null}
    </div>
  );
}
