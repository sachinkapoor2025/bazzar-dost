import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddressManager } from "@/components/account-forms";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Saved addresses", robots: { index: false, follow: false } };

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/addresses");
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] });
  return (
    <div>
      <h1 className="mb-4 font-display text-4xl">Saved addresses</h1>
      <p className="mb-4 max-w-3xl text-base leading-7 text-muted">Addresses saved here can be reused at checkout. Each one needs a street, city, state, and 6-digit PIN code. The list is visible only on this account.</p>
      <AddressManager initial={addresses} />
    </div>
  );
}
