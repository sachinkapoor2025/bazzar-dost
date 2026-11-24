import type { Metadata } from "next";
import Link from "next/link";
import { HomeReviews } from "@/components/home-reviews";
import { JsonLd } from "@/components/json-ld";
import { ProductGrid } from "@/components/product-card";
import { Container, SectionTitle, buttonClass } from "@/components/ui";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT_RUPEES } from "@/lib/commerce";
import { getHomeData, getReviews } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import { absoluteUrl, site } from "@/lib/site";

export const dynamic = "force-dynamic";

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className={`${buttonClass("outline")} whitespace-nowrap px-3`}>
      View all
    </Link>
  );
}

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [data, reviews] = await Promise.all([getHomeData(), getReviews()]);

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
              logo: {
                "@type": "ImageObject",
                url: absoluteUrl("/logo.png"),
                width: 850,
                height: 731,
              },
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
      <section className="home-banner relative isolate flex flex-col justify-end overflow-hidden bg-forest-950 text-cream-50">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <picture>
            <source media="(max-width: 639px)" srcSet="/media/hero-mobile.jpg" />
            <img src="/media/hero-wallpaper.jpg" alt="" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover object-right sm:object-center" />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950 via-forest-950/88 to-forest-950/45" />
        </div>
        <Container className="relative flex h-full min-h-0 flex-col justify-end gap-3 py-5 sm:gap-4 sm:py-8">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-400 sm:text-sm">{site.tagline}</p>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-5xl lg:text-6xl">Practical products for home and everyday use.</h1>
            <p className="mt-3 line-clamp-3 max-w-2xl text-sm leading-6 text-cream-100 sm:line-clamp-4 sm:text-base sm:leading-7">Kitchen tools, personal care, phone accessories, toys, bags, and outdoor items from the current catalogue. Each price and stock count is the one stored for that product.</p>
          </div>
          <Link href="/shop" className={`${buttonClass("gold")} w-fit px-6 py-2.5 text-sm sm:px-8 sm:py-3 sm:text-base`}>Shop now</Link>
        </Container>
      </section>

      {data.trending.length > 0 ? (
        <Container className="pt-10 pb-8">
          <SectionTitle id="trending" title="Trending products" action={<ViewAll href="/trending" />} />
          <p className="mb-4 max-w-3xl text-base leading-7 text-muted">Products shoppers open most often. The order follows recorded page views, not a hand-picked list.</p>
          <ProductGrid products={data.trending} priorityCount={2} layout="home" />
        </Container>
      ) : null}

      {data.featured.length > 0 ? (
        <Container className="pt-10 pb-8 [content-visibility:auto] [contain-intrinsic-size:auto_32rem]">
          <SectionTitle id="featured" title="Featured products" action={<ViewAll href="/featured" />} />
          <p className="mb-4 max-w-3xl text-base leading-7 text-muted">Highlights marked in the catalogue.</p>
          <ProductGrid products={data.featured} layout="home" />
        </Container>
      ) : null}

      {data.arrivals.length > 0 ? (
        <Container className="pb-8 [content-visibility:auto] [contain-intrinsic-size:auto_32rem]">
          <SectionTitle id="arrivals" title="New arrivals" action={<ViewAll href="/new-arrivals" />} />
          <p className="mb-4 max-w-3xl text-base leading-7 text-muted">Products added to the catalogue in the last 90 days.</p>
          <ProductGrid products={data.arrivals} layout="home" />
        </Container>
      ) : null}

      {data.searched.length > 0 ? (
        <Container className="pb-8 [content-visibility:auto] [contain-intrinsic-size:auto_32rem]">
          <SectionTitle id="searched" title="Most searched products" action={<ViewAll href="/most-searched" />} />
          <p className="mb-4 max-w-3xl text-base leading-7 text-muted">Products opened from search.</p>
          <ProductGrid products={data.searched} layout="home" />
        </Container>
      ) : null}

      {data.deals.length > 0 ? (
        <Container className="pb-8 [content-visibility:auto] [contain-intrinsic-size:auto_32rem]">
          <SectionTitle id="deals" title="Deals and offers" action={<ViewAll href="/deals" />} />
          <p className="mb-4 max-w-3xl text-base leading-7 text-muted">Products whose selling price is lower than the compare-at price stored in the catalogue.</p>
          <ProductGrid products={data.deals} layout="home" />
        </Container>
      ) : null}

      {data.bestSellers.length > 0 ? (
        <Container className="pb-8 [content-visibility:auto] [contain-intrinsic-size:auto_32rem]">
          <SectionTitle id="trusted" title="Most trusted and best selling" action={<ViewAll href="/best-sellers" />} />
          <p className="mb-4 max-w-3xl text-base leading-7 text-muted">Products customers have ordered. Cancelled orders are left out.</p>
          <ProductGrid products={data.bestSellers} layout="home" />
        </Container>
      ) : null}

      <Container className="pt-10 pb-12">
        <section className="rounded-2xl border border-cream-300 bg-white p-5 sm:p-8">
          <h2 className="font-display text-3xl text-forest-900">Shop everyday products at BazaarDost</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
            BazaarDost lists practical products for home and daily use. Each product page shows the selling price, the quantity in stock, and the photos stored for that item. A crossed-out price appears only when the catalogue also stores a higher compare-at price.
          </p>
          <h3 className="mt-6 font-display text-2xl text-forest-900">Departments you can browse</h3>
          <p className="mt-2 max-w-3xl text-base leading-7 text-muted">The full catalogue has {data.productCount} active {data.productCount === 1 ? "product" : "products"}, which is the same total shown on <Link href="/shop" className="font-semibold underline">All products</Link>. A department number includes that department and its smaller sections, so the chips are not a second product list. Open a department to see only the products filed there.</p>
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
          <h3 className="mt-6 font-display text-2xl text-forest-900">More from the shop</h3>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-forest-800">
            <Link href="/shop" className="underline">All products</Link>
            <Link href="/deals" className="underline">Deals and offers</Link>
            <Link href="/new-arrivals" className="underline">New arrivals</Link>
            <Link href="/best-sellers" className="underline">Best sellers</Link>
            <Link href="/shipping-policy" className="underline">Shipping</Link>
            <Link href="/returns" className="underline">Returns</Link>
            <Link href="/track" className="underline">Track an order</Link>
            <Link href="/contact" className="underline">Contact</Link>
            <Link href="/faq" className="underline">Questions</Link>
            <Link href="/about" className="underline">About the shop</Link>
          </p>
        </section>
      </Container>

      <Container className="pb-12">
        <section aria-labelledby="customer-reviews">
          <h2 id="customer-reviews" className="font-display text-3xl text-forest-900">Customer reviews</h2>
          <HomeReviews reviews={reviews} />
        </section>
      </Container>

    </>
  );
}
