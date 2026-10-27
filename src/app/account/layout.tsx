import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { Container } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

const links = [
  ["/account", "Overview"],
  ["/account/profile", "Profile"],
  ["/account/addresses", "Addresses"],
  ["/account/orders", "Orders"],
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  return (
    <Container className="grid gap-6 py-6 md:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-cream-300 bg-white p-3">
        <p className="font-semibold">{user.name}</p>
        <p className="text-xs text-muted">{user.email}</p>
        <nav aria-label="Account" className="mt-3 grid gap-1 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-xl px-2 py-2 hover:bg-cream-100">{label}</Link>
          ))}
          <Link href="/track" className="rounded-xl px-2 py-2 hover:bg-cream-100">Track an order</Link>
          {user.role === "admin" ? <Link href="/admin" className="rounded-xl px-2 py-2 font-semibold text-forest-800 hover:bg-cream-100">Admin</Link> : null}
        </nav>
        <SignOutButton />
      </aside>
      <div>{children}</div>
    </Container>
  );
}
