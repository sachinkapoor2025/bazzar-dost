import type { Metadata } from "next";
import Link from "next/link";
import { WholesaleForm } from "@/components/enquiry-forms";
import { ProductGrid } from "@/components/product-card";
import { Container, buttonClass } from "@/components/ui";
import { cardsWhere } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Wholesale",
  description: "Enquire about bulk buying from the BazaarDost catalogue. Quantity prices appear only where the store has set them.",
  alternates: { canonical: "/wholesale" },
};

export default async function WholesalePage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const params = await searchParams;
  const products = await cardsWhere({ isActive: true, wholesaleEligible: true }, 24, { name: "asc" });
  return (
    <Container className="py-6">
      <h1 className="font-display text-4xl text-forest-900">Wholesale</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
        BazaarDost accepts bulk enquiries for products marked as wholesale-eligible. A minimum quantity and wholesale price are shown only when they are saved on that product. Sending this form stores a message for the store team. It does not create an order, charge you, or reserve stock.
      </p>
      <a href="/api/catalogue" className={`${buttonClass("outline")} mt-4`}>Download product list</a>
      <ol className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <li className="rounded-2xl bg-white p-4"><strong>1.</strong> Choose eligible products below.</li>
        <li className="rounded-2xl bg-white p-4"><strong>2.</strong> Tell us the business, quantity, and city.</li>
        <li className="rounded-2xl bg-white p-4"><strong>3.</strong> The store confirms price and dispatch separately. Email is sent only if outbound mail is configured.</li>
      </ol>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          {products.length === 0 ? <p>No products are marked for wholesale yet.</p> : <ProductGrid products={products} />}
          <ul className="mt-4 space-y-2 text-sm">
            {products.map((product) => (
              <li key={product.id}>
                <Link href={`/products/${product.slug}`} className="font-semibold text-forest-800">{product.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <WholesaleForm initialProduct={params.product || ""} />
      </div>
      <p className="mt-6 text-sm text-muted">Retail checkout remains available for smaller quantities at the selling price. Wholesale prices, where shown, are not applied automatically in the cart.</p>
    </Container>
  );
}
