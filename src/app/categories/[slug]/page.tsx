import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogBrowser } from "@/components/catalog-browser";
import { getCategory } from "@/lib/catalog";

function productsInFamily(category: { _count: { products: number }; children: Array<{ _count: { products: number } }> }) {
  return category._count.products + category.children.reduce((sum, child) => sum + child._count.products, 0);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category || productsInFamily(category) === 0) notFound();
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
  if (!category || productsInFamily(category) === 0) notFound();
  return (
    <CatalogBrowser
      title={category.name}
      intro={
        <>
          {category.description ? <p>{category.description}</p> : null}
          <p>Open an item to see its price, stock, and photos. Child departments listed above keep their own products, and the count includes those items.</p>
        </>
      }
      basePath={`/categories/${category.slug}`}
      searchParams={searchParams}
      preset={{ category: category.slug }}
      lockCategory
      crumbs={[
        { name: "Home", href: "/" },
        { name: "Categories", href: "/categories" },
        ...(category.parent && (category.parent.productCount ?? 0) > 0 ? [{ name: category.parent.name, href: `/categories/${category.parent.slug}` }] : []),
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
