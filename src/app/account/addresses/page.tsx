import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddressManager } from "@/components/account-forms";
import { api } from "@/lib/backend";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Saved addresses", robots: { index: false, follow: false } };

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/addresses");
  const addresses = await api<Array<{ id: string; label: string; fullName: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string; isDefault: boolean }>>("/account/addresses");
  return (
    <div>
      <h1 className="mb-4 font-display text-4xl">Saved addresses</h1>
      <AddressManager initial={addresses} />
    </div>
  );
}
