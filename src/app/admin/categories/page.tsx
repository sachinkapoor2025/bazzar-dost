import { CategoryManager } from "@/components/admin-managers";
import { api } from "@/lib/backend";

export default async function AdminCategoriesPage() {
  const categories = await api<Array<{ id: string; name: string; slug: string; description: string; image: string; sortOrder: number }>>("/admin/categories");
  return (
    <div>
      <h1 className="mb-4 font-display text-4xl">Categories</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
