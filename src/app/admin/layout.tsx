import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const links = [
  ["/admin", "Overview"],
  ["/admin/products", "Products"],
  ["/admin/categories", "Categories"],
  ["/admin/orders", "Orders"],
  ["/admin/customers", "Customers"],
  ["/admin/inquiries", "Inquiries"],
  ["/admin/promotions", "Promotions"],
  ["/admin/coupons", "Coupons"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") {
    return <Container className="py-10"><h1 className="font-display text-3xl">Admin is limited to store staff.</h1></Container>;
  }
  return (
    <Container className="grid gap-6 py-6 md:grid-cols-[13rem_minmax(0,1fr)]">
      <nav aria-label="Admin" className="flex flex-wrap gap-2 md:grid md:h-fit">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-full border border-cream-300 bg-white px-3 py-2 text-sm font-semibold">{label}</Link>
        ))}
      </nav>
      <div>{children}</div>
    </Container>
  );
}
