import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "@/components/info";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: "BazaarDost is a shopping catalogue for everyday products, visible prices, and wholesale enquiries.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Info title="About BazaarDost" lede={site.tagline}>
      <p>BazaarDost is a shopping catalogue for useful everyday products. You can browse by category, compare the price that is actually stored for each product, and send a wholesale enquiry when a product is marked for bulk buying.</p>
      <p>Checkout currently accepts cash on delivery. The website does not ask for card numbers, and an order stays unpaid until the store records that payment was collected. Shipping charges shown at checkout come from the store’s published rule, not from a promised delivery window.</p>
      <p>The starter catalogue can be edited in the admin. Product names, prices, stock, and discounts on the site are the records in the database.</p>
      <p><Link href="/shop" className="font-semibold underline">Shop the catalogue</Link> or <Link href="/contact" className="font-semibold underline">contact the store</Link>.</p>
    </Info>
  );
}
