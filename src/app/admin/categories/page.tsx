import { CategoryManager } from "@/components/admin-managers";
import { prisma } from "@/lib/db";

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim() || "";
  const categories = await prisma.category.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q, mode: "insensitive" } }] } : undefined,
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return (
    <div>
      <h1 className="mb-4 font-display text-4xl">Categories</h1>
      <form action="/admin/categories" className="mb-4">
        <input name="q" defaultValue={q} placeholder="Search categories" className="min-h-11 w-full max-w-md rounded-full border border-cream-300 bg-white px-4 text-sm" />
      </form>
      <ul className="mb-4 text-sm text-muted">
        {categories.map((category) => <li key={category.id}>{category.name}: {category._count.products} products</li>)}
      </ul>
      <CategoryManager categories={categories} />
    </div>
  );
}
