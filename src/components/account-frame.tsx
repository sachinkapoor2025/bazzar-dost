"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { buttonClass } from "@/components/ui";
import type { PublicUser } from "@/lib/types";

const tabs = [
  { href: "/account/orders", label: "Orders", match: ["/account", "/account/orders"] },
  { href: "/account/addresses", label: "Addresses", match: ["/account/addresses"] },
  { href: "/account/payments", label: "Payment methods", match: ["/account/payments"] },
  { href: "/account/profile", label: "Account details", match: ["/account/profile"] },
];

export function AccountFrame({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="bg-cream-100">
      <div className="mx-auto w-full px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 rounded-2xl bg-forest-900 px-6 py-8 text-cream-50 shadow-card sm:px-10">
          <p className="max-w-3xl text-lg leading-relaxed sm:text-xl">Welcome back to your account. Manage orders, addresses and profile details easily.</p>
        </div>
        <div className="rounded-2xl border border-cream-300 bg-white p-6 shadow-card sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-forest-900 sm:text-4xl">My Account</h1>
              <p className="mt-1 text-sm text-muted">Signed in as {user.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/wishlist" className="text-sm font-semibold text-forest-800 underline">Wishlist</Link>
              {user.role === "admin" ? <Link href="/admin" className={buttonClass("primary")}>Admin Dashboard</Link> : null}
            </div>
          </div>
          <nav aria-label="Account" className="-mx-2 flex gap-x-5 overflow-x-auto border-b border-cream-200 px-2">
            {tabs.map((tab) => {
              const active = tab.match.some((path) => pathname === path || (path !== "/account" && pathname.startsWith(`${path}/`)));
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "shrink-0 whitespace-nowrap border-b-2 border-forest-900 pb-2 text-sm font-semibold text-forest-900" : "shrink-0 whitespace-nowrap border-b-2 border-transparent pb-2 text-sm font-semibold text-muted hover:text-forest-900"}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6">{children}</div>
          <div className="mt-8 flex justify-end border-t border-cream-200 pt-6">
            <SignOutButton className="min-w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}
