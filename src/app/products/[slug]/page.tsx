import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Gallery } from "@/components/gallery";
import { JsonLd } from "@/components/json-ld";
import { ProductGrid } from "@/components/product-card";
import { PurchasePanel } from "@/components/purchase-panel";
import { RecentlyViewed, RecordView } from "@/components/recently-viewed";
import { Container } from "@/components/ui";
import { getProduct, parseSpecs, relatedProducts, toCard } from "@/lib/catalog";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT_RUPEES } from "@/lib/commerce";
import { formatINR } from "@/lib/format";
import { absoluteUrl, site } from "@/lib/site";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const description = product.shortDescription || product.description.slice(0, 155);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      url: absoluteUrl(`/products/${product.slug}`),
      images: product.images[0] ? [{ url: product.images[0].url, alt: product.images[0].alt || product.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const card = toCard(product);
  const specs = parseSpecs(product.specifications);
  const related = await relatedProducts(product.categoryId, product.id);
  const images = product.images.map((image) => ({ url: image.url, alt: image.alt || product.name }));

  return (
    <Container className="py-6">
      <RecordView slug={product.slug} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Shop", href: "/shop" },
          { name: product.category.name, href: `/categories/${product.category.slug}` },
          { name: product.name },
        ]}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Gallery images={images} name={product.name} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{product.category.name}</p>
          <h1 className="mt-1 font-display text-4xl leading-tight text-forest-900">{product.name}</h1>
          {product.shortDescription ? <p className="mt-3 text-sm leading-6 text-muted">{product.shortDescription}</p> : null}
          <div className="mt-4">
            <PurchasePanel
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                stock: product.stock,
                sku: product.sku,
                image: images[0]?.url || "",
                variants: card.variants,
              }}
            />
          </div>
          {product.wholesaleEligible ? (
            <p className="mt-4 rounded-2xl bg-cream-100 px-4 py-3 text-sm leading-6">
              This product can be included in a wholesale enquiry
              {product.minOrderQty ? ` from ${product.minOrderQty} units` : ""}
              {product.wholesalePrice ? ` at ${formatINR(product.wholesalePrice)} each` : ""}. An enquiry does not reserve stock.{" "}
              <a className="font-semibold underline" href={`/wholesale?product=${encodeURIComponent(product.name)}`}>Send a wholesale enquiry</a>
            </p>
          ) : null}
          <div className="mt-4 space-y-2 text-sm leading-6 text-muted">
            <p>Shipping is {formatINR(SHIPPING_FLAT_RUPEES)}, or free when the payable product total reaches {formatINR(FREE_SHIPPING_ABOVE)}. A delivery date is confirmed after the order is placed.</p>
            <p>Cancellation can be requested while an order is Placed or Confirmed. <a className="underline" href="/shipping-policy">Shipping policy</a> · <a className="underline" href="/returns">Return and refund policy</a></p>
          </div>
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl">Description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{product.description}</p>
        </section>
        {specs.length > 0 ? (
          <section>
            <h2 className="font-display text-2xl">Specifications</h2>
            <table className="mt-2 w-full text-left text-sm">
              <tbody>
                {specs.map((spec) => (
                  <tr key={spec.label} className="border-b border-cream-200">
                    <th className="w-1/3 py-2 pr-3 font-semibold">{spec.label}</th>
                    <td className="py-2 text-muted">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}
      </div>
      {related.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-3xl">Related products</h2>
          <ProductGrid products={related} />
        </section>
      ) : null}
      <div className="mt-8">
        <RecentlyViewed exclude={product.slug} />
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          sku: product.sku,
          image: images.map((image) => absoluteUrl(image.url)),
          offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price: String(card.fromPrice ? product.price : card.price),
            availability: card.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: absoluteUrl(`/products/${product.slug}`),
            seller: { "@type": "Organization", name: site.name },
          },
        }}
      />
    </Container>
  );
}
