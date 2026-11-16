import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { Container } from "@/components/ui";
import { tryApi } from "@/lib/backend";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const addresses = user
    ? await tryApi<Array<{ id: string; label: string; fullName: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string; isDefault: boolean }>>("/account/addresses", [])
    : [];
  return (
    <Container className="py-6">
      <h1 className="mb-2 font-display text-4xl text-forest-900">Checkout</h1>
      <p className="mb-4 max-w-3xl text-base leading-7 text-muted">{user ? `Signed in as ${user.email}. Saved addresses for this account can be used below.` : "You can check out as a guest, or sign in to use saved addresses."} The cart total is checked again here, shipping is added before you place the order, and payment is cash on delivery.</p>
      <CheckoutForm mode={params.mode === "now" ? "now" : "cart"} user={user} addresses={addresses} />
    </Container>
  );
}
