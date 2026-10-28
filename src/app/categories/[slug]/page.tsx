import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogBrowser } from "@/components/catalog-browser";
import { getCategory } from "@/lib/catalog";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) notFound();
  return {
    title: category.name,
    description: category.description || `Shop ${category.name} at BazaarDost.`,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const category = await getCategory((await params).slug);
  if (!category) notFound();
  return (
    <CatalogBrowser
      title={category.name}
      intro={category.description}
      basePath={`/categories/${category.slug}`}
      searchParams={searchParams}
      preset={{ category: category.slug }}
      lockCategory
      crumbs={[
        { name: "Home", href: "/" },
        { name: "Categories", href: "/categories" },
        ...(category.parent ? [{ name: category.parent.name, href: `/categories/${category.parent.slug}` }] : []),
        { name: category.name },
      ]}
      links={category.children
        .filter((child) => child._count.products > 0)
        .map((child) => ({
          href: `/categories/${child.slug}`,
          name: child.name,
          count: child._count.products,
        }))}
    />
  );
}
