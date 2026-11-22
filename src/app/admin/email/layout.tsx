"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/email", label: "Dashboard", exact: true },
  { href: "/admin/email/nudges", label: "Checkout nudges" },
  { href: "/admin/email/compose", label: "Compose" },
  { href: "/admin/email/upload", label: "Upload recipients" },
  { href: "/admin/email/campaigns", label: "Campaigns" },
  { href: "/admin/email/templates", label: "Templates" },
  { href: "/admin/email/queue", label: "Queue" },
  { href: "/admin/email/analytics", label: "Analytics" },
  { href: "/admin/email/suppression", label: "Unsubscribed" },
  { href: "/admin/email/review-request", label: "Review request" },
  { href: "/admin/email/settings", label: "Settings" },
];

export default function EmailLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div>
      <h1 className="font-display text-4xl">Marketing Email</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Send a plain-text message to newsletter subscribers. Messages go out only when email delivery is configured. Unsubscribed addresses are skipped.</p>
      <nav aria-label="Marketing email" className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={active ? "rounded-full bg-forest-800 px-3 py-1.5 text-sm font-semibold text-cream-50" : "rounded-full border border-cream-300 bg-white px-3 py-1.5 text-sm font-semibold text-forest-900"}>
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
