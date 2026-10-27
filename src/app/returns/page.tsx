import type { Metadata } from "next";
import { Info } from "@/components/info";

export const metadata: Metadata = {
  title: "Return and refund policy",
  description: "How BazaarDost handles cancellation and refunds.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <Info title="Return and refund policy" lede="Cancellation and refunds follow what this website can actually record.">
      <p>You can ask to cancel an order while its status is Placed or Confirmed. Use the contact form and include the order number. The store changes the status in the admin. When an order is marked cancelled, the reserved stock is added back if the product or option still exists.</p>
      <p>Orders marked Processing, Shipped, or Delivered are not cancelled by the website automatically. The store can still mark one cancelled after review. A cancelled order cannot be moved back to an earlier status, so stock is not adjusted twice.</p>
      <p>Cash on delivery orders have no online payment to refund. If the store has marked a payment as paid and later agrees a refund, the payment status can be set to refunded. The money movement itself happens outside this website.</p>
      <p>There is no automatic return window and no prepaid return label.</p>
    </Info>
  );
}
