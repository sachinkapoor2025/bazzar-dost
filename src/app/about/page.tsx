import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "@/components/info";
import { RegistrationCertificates } from "@/components/registration-certificates";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About us",
  description: "About BazaarDost, an Indian shop for home, kitchen, beauty, accessories, toys, and outdoor products, with catalogue prices and cash on delivery.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Info title="About BazaarDost" lede={site.tagline}>
      <h2 className="font-display text-2xl text-forest-900">What the shop sells</h2>
      <p>BazaarDost is a shop for practical everyday products: home and kitchen tools, beauty and personal care, phone and electronics accessories, toys, bags, home decor, garden items, and more. Departments appear only when they contain products, so the menu matches what you can buy.</p>
      <h2 className="font-display text-2xl text-forest-900">How the catalogue is organised</h2>
      <p>The catalogue is organised by department. A parent department includes the products filed directly under it and the products in its child departments. Opening a child shows only that smaller set.</p>
      <h2 className="font-display text-2xl text-forest-900">Prices, stock, and checkout</h2>
      <p>Each product page shows the stored selling price, stock, and photos supplied for that item. A discount appears only when the product has a higher compare-at price. You can search the catalogue, filter by department and price, and add in-stock items to the cart.</p>
      <p>Checkout accepts cash on delivery. The website does not ask for card numbers, and an order stays unpaid until the store records that payment was collected. Shipping shown at checkout follows the published rule: a flat charge, waived when the product total reaches the free-shipping amount. The details are on the <Link href="/shipping-policy" className="font-semibold underline">shipping policy</Link>.</p>
      <h2 className="font-display text-2xl text-forest-900">Accounts and orders</h2>
      <p>An account keeps your orders, saved addresses, and profile name. Guests can still check out and later look up an order with the order number and checkout email. A wishlist saved in the browser stays on that device until you sign in.</p>
      <p><Link href="/shop" className="font-semibold underline">Shop the catalogue</Link>, read the <Link href="/faq" className="font-semibold underline">questions</Link>, or <Link href="/contact" className="font-semibold underline">contact the store</Link>.</p>
      <RegistrationCertificates />
    </Info>
  );
}
