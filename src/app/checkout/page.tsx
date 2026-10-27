import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { Container } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const addresses = user
    ? await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] })
    : [];
  return (
    <Container className="py-6">
      <h1 className="mb-2 font-display text-4xl text-forest-900">Checkout</h1>
      <p className="mb-4 text-sm text-muted">{user ? `Signed in as ${user.email}.` : "You can check out as a guest, or sign in to use saved addresses."}</p>
      <CheckoutForm mode={params.mode === "now" ? "now" : "cart"} user={user} addresses={addresses} />
    </Container>
  );
}
