import { CategoryManager } from "@/components/admin-managers";
import { prisma } from "@/lib/db";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1 className="mb-4 font-display text-4xl">Categories</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
