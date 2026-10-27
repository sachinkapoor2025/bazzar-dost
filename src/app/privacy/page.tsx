import type { Metadata } from "next";
import { Info } from "@/components/info";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What BazaarDost stores about accounts, orders, wishlists, and enquiries.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <Info title="Privacy policy" lede="This policy describes the data this website stores. It does not describe a separate analytics vendor, because none is built in.">
      <p>If you create an account, the store keeps your name, email, phone if you add one, and a hashed password. The password cannot be read back. A signed login cookie stays on your browser for up to 14 days.</p>
      <p>Saved addresses, orders, and an account wishlist are stored against that account. Orders also keep the delivery details that were entered at checkout, including guest orders that have no account.</p>
      <p>A guest wishlist and cart stay in the browser until you clear them. Signing in merges the browser wishlist into the account wishlist.</p>
      <p>Contact messages, wholesale enquiries, and newsletter addresses are stored so the store team can read them in the admin. They are not shown to other customers.</p>
      <p>Product pages record a view count. The count is not tied to your name.</p>
      <p>Card numbers are not collected. Do not send card details in a contact message.</p>
      <p>The store does not sell customer lists from this website. Access to orders and addresses is limited to the signed-in customer and store admins.</p>
    </Info>
  );
}
