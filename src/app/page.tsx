import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { RecentlyViewed } from "@/components/recently-viewed";
import { JsonLd } from "@/components/json-ld";
import { ProductGrid, ProductImage } from "@/components/product-card";
import { Container, SectionTitle, buttonClass } from "@/components/ui";
import { getHomeData } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description: "Explore everyday essentials, trending products and exciting deals — all in one place.",
  alternates: { canonical: "/" },
};

const services = [
  ["Convenient shopping", "Browse categories, search, and keep a wishlist in the browser or on your account."],
  ["Value deals", "Reduced prices appear only when a product has a higher compare-at price on record."],
  ["Secure checkout", "Card numbers are not collected. Cash on delivery stays unpaid until the store records payment."],
  ["Order tracking", "Signed-in customers can open their orders. Guests can track with the order number and email."],
  ["Customer support", "Contact and wholesale forms are saved for the store team to review."],
];

export default async function HomePage() {
  const data = await getHomeData();
  const collage = data.categories.slice(0, 4);
  const bands = [
    ["₹199 and under", data.budget.under199, "/shop?max=199"],
    ["₹200 to ₹499", data.budget.from200to499, "/shop?min=200&max=499"],
    ["₹500 to ₹999", data.budget.from500to999, "/shop?min=500&max=999"],
  ] as const;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: site.name,
          url: site.url,
          slogan: site.tagline,
          logo: absoluteUrl("/icon.svg"),
        }}
      />
      <Container className="grid items-stretch gap-3 py-5 lg:grid-cols-2">
        <div className="flex flex-col justify-center rounded-3xl bg-forest-800 px-6 py-8 text-cream-50 md:px-10">
          <p className="text-sm font-semibold text-gold-400">{site.tagline}</p>
          <h1 className="mt-3 max-w-md font-display text-4xl leading-[1.05] md:text-5xl">Good Finds. Better Prices.</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-cream-100">Explore everyday essentials, trending products and exciting deals — all in one place.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/shop" className={buttonClass("gold")}>Shop now</Link>
            <Link href="/deals" className={buttonClass("cream")}>Discover Deals</Link>
          </div>
          <p className="mt-6 text-sm text-cream-200">{data.productCount} active products in the catalogue.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {collage.map((category) => (
            <Link key={category.slug} href={`/categories/${category.slug}`} className="group relative min-h-40 overflow-hidden rounded-3xl bg-forest-900">
              <ProductImage src={category.image} alt={category.name} eager />
              <span className="absolute inset-x-0 bottom-0 bg-forest-950/90 px-3 py-2 font-display text-lg text-cream-50">{category.name}</span>
            </Link>
          ))}
        </div>
      </Container>

      <Container className="pt-8">
        <SectionTitle id="why" title="Why choose BazaarDost" />
        <ul className="grid overflow-hidden rounded-2xl border border-cream-300 bg-cream-300 sm:grid-cols-2 lg:grid-cols-5">
          {services.map(([title, copy]) => (
            <li key={title} className="bg-cream-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-forest-900">{title}</h2>
              <p className="mt-1 text-xs leading-5 text-muted">{copy}</p>
            </li>
          ))}
        </ul>
      </Container>

      <Container className="py-8">
        <SectionTitle id="categories" eyebrow="Browse" title="Shop by category" action={<Link href="/categories" className="text-sm font-semibold text-forest-800">All categories</Link>} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {data.categories.map((category) => (
            <Link key={category.slug} href={`/categories/${category.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-forest-800">
              <ProductImage src={category.image} alt={category.name} />
              <span className="absolute inset-x-0 bottom-0 bg-forest-900 px-3 py-3 text-cream-50">
                <span className="block font-display text-xl leading-tight">{category.name}</span>
                <span className="text-xs text-cream-200">{category.productCount} products</span>
              </span>
            </Link>
          ))}
        </div>
      </Container>

      <Container className="pb-8">
        <SectionTitle id="trending" title="Trending products" />
        {data.trending.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted">Ordered by products shoppers have opened on this site.</p>
            <ProductGrid products={data.trending} />
          </>
        ) : (
          <p className="rounded-2xl border border-dashed border-cream-300 bg-white px-4 py-5 text-sm text-muted">Trending products appear here after shoppers open product pages. Nothing has been ranked yet.</p>
        )}
      </Container>

      <Container className="pb-8">
        <SectionTitle id="budget" title="Shop by budget" action={<Link href="/shop?max=999" className="text-sm font-semibold text-forest-800">Everything up to ₹999</Link>} />
        <div className="grid gap-3 lg:grid-cols-3">
          {bands.map(([label, products, href]) => (
            <section key={label} className="rounded-2xl border border-cream-300 bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-display text-2xl">{label}</h3>
                <Link href={href} className="text-sm font-semibold text-forest-800">View</Link>
              </div>
              {products.length === 0 ? <p className="text-sm text-muted">No products are priced in this band.</p> : (
                <ul className="space-y-3">
                  {products.map((product) => (
                    <li key={product.id}>
                      <Link href={`/products/${product.slug}`} className="grid grid-cols-[4rem_1fr] gap-3">
                        <span className="block aspect-square overflow-hidden rounded-xl bg-cream-100"><ProductImage src={product.image} alt="" /></span>
                        <span>
                          <span className="block font-medium leading-5">{product.name}</span>
                          <span className="text-sm text-muted">{formatINR(product.price)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </Container>

      <Container className="pb-8">
        <SectionTitle id="new" title="New arrivals" action={<Link href="/new-arrivals" className="text-sm font-semibold text-forest-800">View all</Link>} />
        <p className="mb-4 text-sm text-muted">Added in the last 90 days.</p>
        {data.arrivals.length > 0 ? <ProductGrid products={data.arrivals} /> : <p className="text-sm text-muted">No products were added in the last 90 days.</p>}
      </Container>

      <Container className="pb-8">
        <SectionTitle id="best" title="Best sellers" action={<Link href="/best-sellers" className="text-sm font-semibold text-forest-800">View all</Link>} />
        {data.bestSellers.length > 0 ? <ProductGrid products={data.bestSellers} /> : <p className="rounded-2xl border border-dashed border-cream-300 bg-white px-4 py-5 text-sm text-muted">Best sellers are listed after customers place orders. No completed sales are recorded yet.</p>}
      </Container>

      <Container className="pb-8">
        <SectionTitle id="deals" title="Deals of the day" action={<Link href="/deals" className="text-sm font-semibold text-forest-800">View all</Link>} />
        <p className="mb-4 text-sm text-muted">Reduced prices are shown only when a compare-at price on the product is higher. There is no countdown timer.</p>
        {data.deals.length === 0 && data.coupons.length === 0 ? (
          <p className="text-sm text-muted">No reduced prices or coupons are active right now.</p>
        ) : (
          <>
            {data.coupons.length > 0 ? (
              <ul className="mb-4 grid gap-2 md:grid-cols-2">
                {data.coupons.map((coupon) => (
                  <li key={coupon.id} className="rounded-2xl border border-gold-400 bg-white px-4 py-3 text-sm">
                    <span className="font-semibold">{coupon.code}</span>
                    <span className="text-muted"> — {coupon.type === "PERCENT" ? `${coupon.value}% off` : `${formatINR(coupon.value)} off`}{coupon.minSubtotal ? ` from ${formatINR(coupon.minSubtotal)}` : ""}.</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {data.deals.length > 0 ? <ProductGrid products={data.deals} /> : null}
          </>
        )}
      </Container>

      <Container className="pb-8">
        <section className="grid overflow-hidden rounded-3xl border border-forest-800 md:grid-cols-2">
          <div className="bg-forest-900 px-6 py-8 text-cream-50">
            <h2 className="font-display text-4xl">Buying in Bulk?</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-cream-100">Wholesale prices and minimum quantities are shown only on products where the store has set them. An enquiry does not reserve stock or create an order.</p>
            <Link href="/wholesale" className={`${buttonClass("gold")} mt-5`}>Explore Wholesale</Link>
          </div>
          <ol className="space-y-4 bg-cream-100 px-6 py-8 text-sm leading-6">
            <li><strong>1. Check the catalogue.</strong> Eligible products show a wholesale note on the product page.</li>
            <li><strong>2. Send an enquiry.</strong> Include the business name, products, and quantity.</li>
            <li><strong>3. Wait for confirmation.</strong> The store reviews the message before any bulk order is agreed.</li>
          </ol>
        </section>
      </Container>

      <Container className="pb-8">
        <SectionTitle id="lifestyle" title="Shop by lifestyle" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Smart Home Essentials", "home-kitchen"],
            ["Everyday Style", "fashion-bags"],
            ["Useful Gadgets", "electronics-accessories"],
            ["Gifts", "toys-gifts"],
          ].map(([label, slug]) => {
            const category = data.categories.find((item) => item.slug === slug);
            if (!category) return null;
            return (
              <Link key={slug} href={`/categories/${category.slug}`} className="rounded-2xl border border-cream-300 bg-white p-4">
                <h3 className="font-display text-2xl">{label}</h3>
                <p className="mt-2 text-sm text-muted">{category.name} · {category.productCount} products</p>
              </Link>
            );
          })}
        </div>
      </Container>

      <Container className="pb-8">
        <SectionTitle id="reviews" title="Customer reviews" />
        <p className="rounded-2xl border border-dashed border-cream-300 bg-white px-4 py-5 text-sm text-muted">No customer reviews are stored yet. Ratings are hidden until a real review exists, so this section does not show sample quotes.</p>
      </Container>

      <Container className="pb-8">
        <section className="rounded-3xl bg-forest-800 px-6 py-8 text-cream-50">
          <h2 className="font-display text-3xl">Catalogue notes</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-cream-100">Leave an email if you want news about products already in this catalogue. It is saved for the store team.</p>
          <div className="mt-4 max-w-md">
            <NewsletterForm />
          </div>
        </section>
      </Container>

      {data.featured.length > 0 ? (
        <Container className="pb-8">
          <SectionTitle id="featured" title="Featured products" action={<Link href="/shop" className="text-sm font-semibold text-forest-800">Shop all</Link>} />
          <p className="mb-4 text-sm text-muted">Marked as highlights in the catalogue. This is not a sales ranking.</p>
          <ProductGrid products={data.featured} />
        </Container>
      ) : null}

      <Container className="pb-4">
        <RecentlyViewed />
      </Container>
    </>
  );
}
