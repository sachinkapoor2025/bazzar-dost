import type { Metadata } from "next";
import { Info } from "@/components/info";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT_RUPEES } from "@/lib/commerce";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = {
  title: "Shipping policy",
  description: "How BazaarDost calculates shipping at checkout.",
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPage() {
  return (
    <Info title="Shipping policy" lede="This page matches the shipping rule used at checkout.">
      <p>Shipping is {formatINR(SHIPPING_FLAT_RUPEES)} when the product total after discounts is below {formatINR(FREE_SHIPPING_ABOVE)}. At {formatINR(FREE_SHIPPING_ABOVE)} and above, shipping is {formatINR(0)}.</p>
      <p>Prices shown on products are the amount charged for the goods. Checkout does not add a separate tax line.</p>
      <p>The website does not promise a delivery date or a courier. After an order is placed, the store can add a tracking note on the order. Until that note exists, tracking shows that no courier note has been added.</p>
      <p>An address is checked for a complete street, city, state, and 6-digit PIN code. It is not verified against a postal database.</p>
    </Info>
  );
}
