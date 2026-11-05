import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { ProductGrid } from "@/components/product-card";
import { RecentlyViewed } from "@/components/recently-viewed";
import { Container, SectionTitle, buttonClass } from "@/components/ui";
import { getHomeData } from "@/lib/catalog";
import { absoluteUrl, site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: "Shop BazaarDost for home, kitchen, beauty, electronics accessories, toys, travel, and more. Prices and stock come from the live catalogue.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: site.name,
          url: site.url,
          slogan: site.tagline,
          logo: absoluteUrl("/logo.png"),
        }}
      />
      <section className="relative isolate overflow-hidden bg-forest-950 text-cream-50">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-cover bg-[center_right] sm:bg-center" style={{ backgroundImage: "url(/media/hero-wallpaper.jpg)" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950 via-forest-950/88 to-forest-950/55" />
        </div>
        <Container className="relative py-14 md:py-20">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-400">{site.tagline}</p>
            <h1 className="mt-4 font-display text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">Practical products for home and everyday use.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-cream-100">Browse kitchen tools, personal care, phone accessories, toys, bags, and outdoor items. Every price and stock count on this site comes from the current catalogue.</p>
            <div className="mt-8">
              <Link href="/shop" className={`${buttonClass("gold")} px-6 text-base`}>Shop now</Link>
            </div>
            <p className="mt-6 text-sm text-cream-200">{data.productCount} products across {data.categories.length} departments.</p>
          </div>
        </Container>
      </section>

      <Container className="pt-10 pb-8">
        <SectionTitle id="trending" title="Trending products" />
        {data.trending.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted">{data.trendingRanked ? "Ordered by products shoppers have opened on this site." : "Popular products available to order right now."}</p>
            <ProductGrid products={data.trending} />
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-cream-300 bg-white px-4 py-5 text-sm text-muted">Trending products appear here after shoppers open product pages. Nothing has been ranked yet.</p>
        )}
      </Container>

      <Container className="pb-8">
        <SectionTitle id="featured" title="Featured products" action={<Link href="/shop" className="text-sm font-semibold text-forest-800">Shop all</Link>} />
        {data.featured.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted">Marked as highlights in the catalogue. This is not a sales ranking.</p>
            <ProductGrid products={data.featured} />
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-cream-300 bg-white px-4 py-5 text-sm text-muted">Featured products appear here when the catalogue marks highlights.</p>
        )}
      </Container>

      <Container className="pb-8">
        <SectionTitle id="searched" title="Most searched products" action={<Link href="/search" className="text-sm font-semibold text-forest-800">Search</Link>} />
        {data.searched.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted">{data.searchedRanked ? "Ordered by products shoppers open from search and listings." : "Products ready to find in search. This list updates as shoppers open listings."}</p>
            <ProductGrid products={data.searched} />
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-cream-300 bg-white px-4 py-5 text-sm text-muted">Most searched products appear here after shoppers open products from search.</p>
        )}
      </Container>

      <Container className="pb-8">
        <SectionTitle id="trusted" title="Most trusted / best selling" action={<Link href="/best-sellers" className="text-sm font-semibold text-forest-800">View all</Link>} />
        {data.bestSellers.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted">{data.bestSellersRanked ? "Ordered by completed orders." : "Popular products while completed sales are still being recorded."}</p>
            <ProductGrid products={data.bestSellers} />
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-cream-300 bg-white px-4 py-5 text-sm text-muted">Best sellers are listed after customers place orders. No completed sales are recorded yet.</p>
        )}
      </Container>

      <Container className="pb-4">
        <RecentlyViewed />
      </Container>
    </>
  );
}
