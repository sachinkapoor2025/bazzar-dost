import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { ProductGrid } from "@/components/product-card";
import { Container, SectionTitle, buttonClass } from "@/components/ui";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT_RUPEES } from "@/lib/commerce";
import { getHomeData } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import { absoluteUrl, site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: site.name,
              url: site.url,
              slogan: site.tagline,
              logo: absoluteUrl("/logo.png"),
              description: site.description,
            },
            {
              "@type": "WebSite",
              name: site.name,
              url: site.url,
              description: site.description,
              potentialAction: {
                "@type": "SearchAction",
                target: `${site.url}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }}
      />
      <section className="relative isolate min-h-[24rem] overflow-hidden bg-forest-950 text-cream-50 sm:min-h-[32rem] lg:min-h-[40rem]">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <picture>
            <source media="(max-width: 639px)" srcSet="/media/hero-mobile.jpg" />
            <img src="/media/hero-wallpaper.jpg" alt="" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover object-right sm:object-center" />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950 via-forest-950/88 to-forest-950/45" />
        </div>
        <Container className="relative flex min-h-[24rem] flex-col justify-end gap-6 py-12 sm:min-h-[32rem] sm:py-16 lg:min-h-[40rem] lg:py-20">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-400">{site.tagline}</p>
            <h1 className="mt-3 font-display text-4xl leading-tight sm:text-6xl lg:text-7xl">Practical products for home and everyday use.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-cream-100">Kitchen tools, personal care, phone accessories, toys, bags, and outdoor items from the current catalogue. Each price and stock count is the one stored for that product.</p>
          </div>
          <Link href="/shop" className={`${buttonClass("gold")} w-fit px-8 py-3 text-base`}>Shop now</Link>
        </Container>
      </section>

      <Container className="pt-10 pb-8">
        <SectionTitle id="trending" title="Trending products" />
        <p className="mb-4 max-w-3xl text-base leading-7 text-muted">Products shoppers open most often. The order follows recorded page views, not a hand-picked list.</p>
        {data.trending.length > 0 ? (
          <ProductGrid products={data.trending} priorityCount={2} />
        ) : (
          <p className="rounded-2xl border border-dashed border-cream-300 bg-white px-4 py-5 text-sm text-muted">Trending products appear here after shoppers open product pages. Nothing has been ranked yet.</p>
        )}
      </Container>

      <Container className="pb-8 [content-visibility:auto] [contain-intrinsic-size:auto_32rem]">
        <SectionTitle id="featured" title="Featured products" action={<Link href="/shop" className="text-sm font-semibold text-forest-800">Shop all</Link>} />
        <p className="mb-4 max-w-3xl text-base leading-7 text-muted">Highlights marked in the catalogue. When none are marked, this section stays empty rather than filling in other products.</p>
        {data.featured.length > 0 ? (
          <ProductGrid products={data.featured} />
        ) : (
          <p className="rounded-2xl border border-dashed border-cream-300 bg-white px-4 py-5 text-sm text-muted">Featured products appear here when the catalogue marks highlights.</p>
        )}
      </Container>

      <Container className="pb-8 [content-visibility:auto] [contain-intrinsic-size:auto_32rem]">
        <SectionTitle id="searched" title="Most searched products" action={<Link href="/search" className="text-sm font-semibold text-forest-800">Search</Link>} />
        <p className="mb-4 max-w-3xl text-base leading-7 text-muted">Products opened from search. The list grows as shoppers use the search box.</p>
        {data.searched.length > 0 ? (
          <ProductGrid products={data.searched} />
        ) : (
          <p className="rounded-2xl border border-dashed border-cream-300 bg-white px-4 py-5 text-sm text-muted">Most searched products appear here after shoppers open products from search.</p>
        )}
      </Container>

      <Container className="pb-8 [content-visibility:auto] [contain-intrinsic-size:auto_32rem]">
        <SectionTitle id="trusted" title="Most trusted and best selling" action={<Link href="/best-sellers" className="text-sm font-semibold text-forest-800">View all</Link>} />
        <p className="mb-4 max-w-3xl text-base leading-7 text-muted">Products customers have ordered. Cancelled orders are left out, and the list stays empty until the first sale.</p>
        {data.bestSellers.length > 0 ? (
          <ProductGrid products={data.bestSellers} />
        ) : (
          <p className="rounded-2xl border border-dashed border-cream-300 bg-white px-4 py-5 text-sm text-muted">Best sellers are listed after customers place orders. No completed sales are recorded yet.</p>
        )}
      </Container>

      <Container className="pb-12">
        <section className="rounded-2xl border border-cream-300 bg-white p-5 sm:p-8">
          <h2 className="font-display text-3xl text-forest-900">Shop everyday products at BazaarDost</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
            BazaarDost lists practical products for home and daily use. Each product page shows the selling price, the quantity in stock, and the photos stored for that item. A crossed-out price appears only when the catalogue also stores a higher compare-at price.
          </p>
          <h3 className="mt-6 font-display text-2xl text-forest-900">Departments you can browse</h3>
          <p className="mt-2 max-w-3xl text-base leading-7 text-muted">Open a department to see only the products filed there. A parent department also includes the products in its smaller sections.</p>
          {data.categories.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {data.categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/categories/${category.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-cream-300 bg-cream-50 px-4 text-sm font-semibold text-forest-900">
                    {category.name}
                    <span className="ml-2 text-muted">{category.productCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <h3 className="mt-6 font-display text-2xl text-forest-900">Delivery and payment</h3>
          <p className="mt-2 max-w-3xl text-base leading-7 text-muted">
            Checkout is cash on delivery. The order is saved as unpaid until the store records that the payment was collected. Shipping is {formatINR(SHIPPING_FLAT_RUPEES)}, and it is free when the payable product total reaches {formatINR(FREE_SHIPPING_ABOVE)}. The site does not promise a delivery date.
          </p>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-forest-800">
            <Link href="/shop" className="underline">All products</Link>
            <Link href="/deals" className="underline">Deals and offers</Link>
            <Link href="/new-arrivals" className="underline">New arrivals</Link>
            <Link href="/faq" className="underline">Questions</Link>
            <Link href="/about" className="underline">About the shop</Link>
          </p>
        </section>
      </Container>

    </>
  );
}
