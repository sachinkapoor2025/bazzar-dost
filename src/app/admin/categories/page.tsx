import { CategoryManager } from "@/components/admin-managers";
import { readDatabase } from "@/lib/db";

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim() || "";
  const [categories, parents] = await readDatabase([[], []] as const, (client) => Promise.all([
    client.category.findMany({
      where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } : undefined,
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    }),
    client.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]));
  return (
    <div>
      <h1 className="font-display text-4xl">Categories</h1>
      <p className="mb-4 mt-2 max-w-3xl text-sm leading-6 text-muted">Departments group the catalogue. A parent department includes its own products and the products in its child departments. Empty departments are hidden from the shop menu.</p>
      <form action="/admin/categories" className="mb-4">
        <input name="q" defaultValue={q} placeholder="Search categories" className="min-h-11 w-full rounded-full border border-cream-300 bg-white px-4 text-sm" />
      </form>
      <ul className="mb-4 text-sm text-muted">
        {categories.map((category) => <li key={category.id}>{category.name}: {category._count.products} products</li>)}
      </ul>
      <CategoryManager categories={categories} parents={parents} />
    </div>
  );
}
