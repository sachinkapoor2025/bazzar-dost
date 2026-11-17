import type { Metadata } from "next";
import { TrackForm } from "@/components/track-form";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Look up a BazaarDost order with the order number and the email used at checkout.",
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return (
    <Container className="py-8">
      <h1 className="font-display text-4xl">Track an order</h1>
      <p className="mt-2 max-w-3xl text-base leading-7 text-muted">Enter the order number and the email from checkout. The lookup fails unless both match, so someone with only the order number cannot open it. Signed-in customers can also open their orders from My Account. Status moves from Placed through Confirmed, Processing, Shipped, and Out for Delivery to Delivered. A courier note appears only after the store adds one.</p>
      <div className="mt-5">
        <TrackForm />
      </div>
    </Container>
  );
}
