import type { Metadata } from "next";
import { Info } from "@/components/info";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT_RUPEES } from "@/lib/commerce";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shipping policy",
  description: `BazaarDost shipping is ${formatINR(SHIPPING_FLAT_RUPEES)}, and free from ${formatINR(FREE_SHIPPING_ABOVE)}. Checkout does not promise a delivery date.`,
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPage() {
  return (
    <Info title="Shipping policy" lede="This page matches the shipping rule used at checkout.">
      <p>The same shipping rule applies to every product in the catalogue, including home and kitchen, beauty, electronics accessories, toys, bags, and the other departments.</p>
      <p>Shipping is {formatINR(SHIPPING_FLAT_RUPEES)} when the product total after discounts is below {formatINR(FREE_SHIPPING_ABOVE)}. At {formatINR(FREE_SHIPPING_ABOVE)} and above, shipping is {formatINR(0)}.</p>
      <p>Prices shown on products are the amount charged for the goods. Checkout does not add a separate tax line.</p>
      <p>The website does not promise a delivery date or a courier. After an order is placed, the store can add a tracking note on the order. Until that note exists, tracking shows that no courier note has been added.</p>
      <p>An address is checked for a complete street, city, state, and 6-digit PIN code. It is not verified against a postal database.</p>
      <p>The cart shows the shipping amount before you place the order. Changing the product total can move the order across the free-shipping line, and checkout recalculates it on the server. A PIN check on a product page confirms the code format. It does not book a courier or promise a day.</p>
    </Info>
  );
}
