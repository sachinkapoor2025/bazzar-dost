import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/product-card";
import { Container } from "@/components/ui";
import { getCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Categories",
  description: "Shop BazaarDost by category, from home and kitchen to office stationery.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <Container className="py-6">
      <h1 className="font-display text-4xl text-forest-900">Categories</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Choose a category to see only its products.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {categories.map((category) => (
          <Link key={category.slug} href={`/categories/${category.slug}`} className="overflow-hidden rounded-2xl border border-cream-300 bg-white">
            <span className="block aspect-square bg-cream-100"><ProductImage src={category.image} alt="" /></span>
            <span className="block px-3 py-3">
              <span className="block font-display text-xl">{category.name}</span>
              <span className="text-sm text-muted">{category.productCount} products</span>
            </span>
          </Link>
        ))}
      </div>
    </Container>
  );
}
