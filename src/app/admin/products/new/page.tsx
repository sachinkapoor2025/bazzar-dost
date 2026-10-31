import { ProductForm } from "@/components/product-form";
import { prisma } from "@/lib/db";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1 className="mb-4 font-display text-4xl">Add product</h1>
      <ProductForm categories={categories.map((category) => ({ id: category.id, name: category.name }))} />
    </div>
  );
}
