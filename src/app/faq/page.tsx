import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "@/components/info";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT_RUPEES } from "@/lib/commerce";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers about BazaarDost checkout, shipping, wholesale enquiries, accounts, and deals.",
  alternates: { canonical: "/faq" },
};

const faqs = [
  ["Why does a product say out of stock?", "The product page and the product card use the quantity stored for that item. When the quantity is zero, Add to cart is turned off and the label says out of stock. In-stock products can still be ordered."],
  ["How do I pay?", "Checkout offers cash on delivery. The order is saved as unpaid. The store can mark it paid after collection. Card numbers are not collected."],
  ["How is shipping calculated?", `Shipping is ${formatINR(SHIPPING_FLAT_RUPEES)} when the payable product total is below ${formatINR(FREE_SHIPPING_ABOVE)}, and free from that amount. No delivery-day promise is made on the website.`],
  ["When is a product a deal?", "Only when the catalogue stores a compare-at price that is higher than the selling price. The percentage is calculated from those two numbers."],
  ["What is a best seller?", "A product that has been ordered. Cancelled orders are not counted. If nobody has ordered yet, the best-seller list is empty."],
  ["Does a wholesale enquiry place an order?", "No. It stores a message. Quantity prices apply in the cart only if you check out at the retail price. Wholesale prices are confirmed by the store."],
  ["Can I see another customer’s order?", "No. Account pages show only the signed-in customer’s orders. Guest tracking needs both the order number and the checkout email."],
];

export default function FaqPage() {
  return (
    <Info title="Frequently asked questions">
      {faqs.map(([question, answer]) => (
        <section key={question}>
          <h2 className="font-display text-2xl">{question}</h2>
          <p>{answer}</p>
        </section>
      ))}
      <p>Still stuck? <Link href="/contact" className="underline">Contact the store</Link>.</p>
    </Info>
  );
}
