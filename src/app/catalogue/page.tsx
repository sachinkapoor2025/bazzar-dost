import type { Metadata } from "next";
import Link from "next/link";
import { Container, buttonClass } from "@/components/ui";
import { getCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Catalogue",
  description: "Download the current BazaarDost product list with selling prices and stock.",
  alternates: { canonical: "/catalogue" },
};

export default async function CataloguePage() {
  const categories = await getCategories();
  return (
    <Container className="py-8">
      <h1 className="font-display text-4xl text-forest-900">Catalogue</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
        This list is the live shop: product name, SKU, department, selling price, and stock. A compare-at price is included only when the catalogue stores one. Downloading it does not reserve stock or create an order.
      </p>
      <a href="/api/catalogue" className={`${buttonClass("primary")} mt-5`}>Download product list</a>
      <h2 className="mt-8 font-display text-2xl">Departments</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link href={`/categories/${category.slug}`} className="block rounded-2xl border border-cream-300 bg-white px-4 py-3 hover:border-forest-800">
              <span className="font-semibold">{category.name}</span>
              <span className="mt-1 block text-sm text-muted">{category.productCount} products</span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
