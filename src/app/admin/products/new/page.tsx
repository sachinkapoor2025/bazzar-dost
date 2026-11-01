import { ProductForm } from "@/components/product-form";
import { api } from "@/lib/backend";

export default async function NewProductPage() {
  const categories = await api<Array<{ id: string; name: string }>>("/admin/categories");
  return (
    <div>
      <h1 className="mb-4 font-display text-4xl">Add product</h1>
      <ProductForm categories={categories.map((category) => ({ id: category.id, name: category.name }))} />
    </div>
  );
}
