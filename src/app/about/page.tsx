import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "@/components/info";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: "BazaarDost sells practical everyday products across home, beauty, electronics accessories, toys, travel, and more, with the price stored for each item.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Info title="About BazaarDost" lede={site.tagline}>
      <p>BazaarDost is a shop for practical everyday products: home and kitchen tools, beauty and personal care, phone and electronics accessories, toys, bags, home decor, garden items, and more. Departments appear only when they contain products, so the menu matches what you can buy.</p>
      <p>Each product page shows the stored selling price, stock, and photos supplied for that item. A discount appears only when the product has a higher compare-at price. You can search the catalogue, filter by department and price, and add in-stock items to the cart.</p>
      <p>Checkout accepts cash on delivery. The website does not ask for card numbers, and an order stays unpaid until the store records that payment was collected. Shipping shown at checkout follows the published rule: a flat charge, waived when the product total reaches the free-shipping amount.</p>
      <p><Link href="/shop" className="font-semibold underline">Shop the catalogue</Link> or <Link href="/contact" className="font-semibold underline">contact the store</Link>.</p>
    </Info>
  );
}
