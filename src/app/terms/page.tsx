import type { Metadata } from "next";
import { Info } from "@/components/info";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "Terms for using the BazaarDost catalogue, cart, and checkout.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <Info title="Terms and conditions">
      <p>BazaarDost provides a catalogue and cash-on-delivery checkout. A product page shows the price, stock, and options stored for that product at the time you open it. The order total is calculated again on the server when you place the order. If stock has changed, the order is refused instead of being marked successful.</p>
      <p>Placing an order reserves the available stock and creates an unpaid cash-on-delivery order. It is not a card payment and it is not marked paid automatically.</p>
      <p>You are responsible for the accuracy of the delivery details and for keeping your password private. You may only view your own account information.</p>
      <p>Wholesale prices shown on a product are information for an enquiry. They are not applied as a cart discount unless the store changes the selling price or issues a coupon.</p>
      <p>The store may correct a catalogue error, disable a product, or cancel an order that cannot be fulfilled. Those changes are made in the admin and show up on the affected records.</p>
    </Info>
  );
}
