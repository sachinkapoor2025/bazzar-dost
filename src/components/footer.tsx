import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { Container } from "@/components/ui";
import { site } from "@/lib/site";
import type { CategoryLink } from "@/lib/types";

const linkClass =
  "text-xs leading-5 text-white/75 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8E6C9]";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-white">{title}</h3>
      <ul className="mt-1.5 space-y-1">{children}</ul>
    </div>
  );
}

function Item({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className={linkClass}>{children}</Link>
    </li>
  );
}

function SocialGlyph({ name }: { name: string }) {
  const common = { className: "h-4 w-4", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true as const };
  if (name === "Instagram") {
    return (
      <svg {...common}>
        <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-5 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8zM17.4 6.9a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
      </svg>
    );
  }
  if (name === "Facebook") {
    return (
      <svg {...common}>
        <path d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.1C12.2 3 11 4.4 11 6.6v1.9H9v2.7h2V21h3.5v-9.8h2.3l.4-2.7h-2.7z" />
      </svg>
    );
  }
  if (name === "YouTube") {
    return (
      <svg {...common}>
        <path d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6zM9.8 15.5v-6.6l6.2 3.3-6.2 3.3z" />
      </svg>
    );
  }
  return <span className="text-xs font-semibold">{name.slice(0, 1)}</span>;
}

export function Footer({ categories }: { categories: CategoryLink[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-6 bg-[#1A4332] pb-24 text-white md:pb-0">
      <Container className="py-4 md:pr-24">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="BazaarDost home">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sm font-bold leading-none text-[#1A4332]">B</span>
            <span className="text-base font-semibold tracking-tight">BazaarDost</span>
          </Link>
          <p className="text-xs font-medium text-[#A9D7B4]">Your Shopping Partner</p>
        </div>

        <h2 className="mt-2 max-w-3xl text-lg font-semibold leading-snug tracking-tight">
          Everything you need, all in one place.
        </h2>

        <NewsletterForm layout="bar" />

        <nav aria-label="Footer" className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:gap-x-8 lg:grid-cols-4">
          <Column title="Shop">
            <Item href="/shop">All Products</Item>
            <Item href="/categories">Popular Categories</Item>
            <Item href="/new-arrivals">New Arrivals</Item>
            <Item href="/best-sellers">Best Sellers</Item>
            <Item href="/deals">Deals and offers</Item>
            <Item href="/catalogue">Catalogue</Item>
          </Column>
          <Column title="Customer Support">
            <Item href="/contact">Contact Us</Item>
            <Item href="/faq">FAQs</Item>
            <Item href="/shipping-policy">Shipping Policy</Item>
            <Item href="/returns">Returns & Refunds</Item>
            <Item href="/track">Track an order</Item>
            {site.supportEmail ? (
              <li>
                <a href={`mailto:${site.supportEmail}`} className={linkClass}>{site.supportEmail}</a>
              </li>
            ) : null}
          </Column>
          <Column title="About BazaarDost">
            <Item href="/about">Our Story</Item>
            <Item href="/about">Why Choose Us</Item>
            <Item href="/wholesale">Sell With Us</Item>
            <Item href="/about#certificates">Registration certificates</Item>
          </Column>
          <Column title="Quick Links">
            <Item href="/account">My Account</Item>
            <Item href="/account/orders">My Orders</Item>
            <Item href="/wishlist">Wishlist</Item>
            <Item href="/privacy">Privacy Policy</Item>
          </Column>
        </nav>

        {categories.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-white/15 pt-2">
            {categories.slice(0, 4).map((category) => (
              <li key={category.slug}>
                <Link href={`/categories/${category.slug}`} className={linkClass}>{category.name}</Link>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/20 pt-2">
          <p className="text-xs font-semibold">Follow us</p>
          <ul className="flex items-center gap-2">
            {["Instagram", "Facebook", "YouTube"].map((label) => {
              const href = site.social.find(([name]) => name === label)?.[1];
              const iconClass = "inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/30 text-white";
              return (
                <li key={label}>
                  {href ? (
                    <a href={href} rel="noreferrer" aria-label={label} className={`${iconClass} transition hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8E6C9]`}>
                      <SocialGlyph name={label} />
                    </a>
                  ) : (
                    <span className={iconClass} aria-hidden="true">
                      <SocialGlyph name={label} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-2 flex flex-col gap-1 border-t border-white/20 py-2 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} BazaarDost. All rights reserved.</p>
          <nav aria-label="Legal" className="flex items-center gap-4">
            <Link href="/privacy" className="transition hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="transition hover:text-white">Terms & Conditions</Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
