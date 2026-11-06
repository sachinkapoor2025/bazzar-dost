import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogLive } from "@/components/catalog-live";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Container } from "@/components/ui";
import { getCategories, queryCatalog, readCatalogQuery, type CatalogInput } from "@/lib/catalog";

export async function CatalogBrowser({
  title,
  intro,
  basePath,
  searchParams,
  preset,
  lockCategory = false,
  crumbs,
  links,
}: {
  title: string;
  intro?: string;
  basePath: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  preset?: Partial<CatalogInput>;
  lockCategory?: boolean;
  crumbs?: Array<{ name: string; href?: string }>;
  links?: Array<{ href: string; name: string; count: number }>;
}) {
  const query = readCatalogQuery(await searchParams, preset);
  const [result, categories] = await Promise.all([queryCatalog(query), getCategories("all")]);
  if (result.outOfRange) notFound();

  return (
    <Container className="py-6">
      {crumbs ? <Breadcrumbs items={crumbs} /> : null}
      <h1 className="font-display text-4xl text-forest-900">{title}</h1>
      {intro ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{intro}</p> : null}
      {links && links.length > 0 ? (
        <ul className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-cream-300 bg-white px-3 text-sm font-semibold text-forest-900">
                {link.name} <span className="ml-2 text-muted">{link.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <CatalogLive
        basePath={basePath}
        lockCategory={lockCategory}
        categories={categories.map((category) => ({ slug: category.slug, label: category.label }))}
        preset={preset}
        initialQuery={query}
        initialResult={result}
      />
    </Container>
  );
}
