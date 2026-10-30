import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { Logo } from "@/components/logo";
import { Container } from "@/components/ui";
import { site } from "@/lib/site";
import type { CategoryLink } from "@/lib/types";

export function Footer({ categories }: { categories: CategoryLink[] }) {
  return (
    <footer className="mt-10 border-t border-cream-300 bg-forest-900 text-cream-100">
      <Container className="grid gap-8 py-10 md:grid-cols-4">
        <div>
          <Logo tone="light" />
          <p className="mt-3 max-w-xs text-sm leading-6 text-cream-200">{site.tagline}</p>
        </div>
        <div>
          <h2 className="font-semibold text-gold-400">Shop</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/shop">Shop all</Link></li>
            <li><Link href="/deals">Deals and offers</Link></li>
            <li><Link href="/new-arrivals">New arrivals</Link></li>
            <li><Link href="/catalogue">Catalogue</Link></li>
            <li><Link href="/wholesale">Wholesale</Link></li>
            {categories.slice(0, 4).map((category) => (
              <li key={category.slug}><Link href={`/categories/${category.slug}`}>{category.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-gold-400">Help</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/account">My account</Link></li>
            <li><Link href="/track">Track an order</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/shipping-policy">Shipping policy</Link></li>
            <li><Link href="/returns">Returns</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-gold-400">Updates</h2>
          <p className="mt-3 text-sm leading-6">Leave your email for catalogue news. It is stored for the store team.</p>
          <NewsletterForm />
          {site.supportEmail ? <p className="mt-3 text-sm">{site.supportEmail}</p> : null}
          {site.social.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm">
              {site.social.map(([label, href]) => (
                <li key={label}><a href={href} rel="noreferrer">{label}</a></li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
      <div className="border-t border-white/10 py-4 text-center text-xs text-cream-200">© {new Date().getFullYear()} BazaarDost</div>
    </footer>
  );
}
