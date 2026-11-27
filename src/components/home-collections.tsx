import Link from "next/link";
import { FREE_SHIPPING_ABOVE, SHIPPING_FLAT_RUPEES } from "@/lib/commerce";
import { formatINR } from "@/lib/format";
import type { CategoryLink } from "@/lib/types";

const themes = [
  { title: "Kitchen", test: (name: string) => /kitchen/i.test(name) },
  { title: "Home organisation", test: (name: string) => /organi[sz]/i.test(name) },
  { title: "Cleaning", test: (name: string) => /clean/i.test(name) },
  { title: "Gadgets", test: (name: string) => /electronic|gadget/i.test(name) },
  { title: "Personal care", test: (name: string) => /beauty|personal care/i.test(name) },
];

export function HomeCollections({ categories }: { categories: CategoryLink[] }) {
  const used = new Set<string>();
  const links = themes.flatMap((theme) => {
    const match = categories.find((category) => category.productCount > 0 && !used.has(category.slug) && theme.test(category.name));
    if (!match) return [];
    used.add(match.slug);
    return [{ href: `/categories/${match.slug}`, title: match.name, note: `${match.productCount} in stock listings` }];
  });

  return (
    <div className="border-b border-cream-300 bg-white">
      <div className="mx-auto w-full px-4 pt-5 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-forest-700">BazaarDost</p>
        <h2 className="font-display text-3xl text-forest-900 sm:text-4xl">Everything you need, all in one place.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-forest-900">Kitchen, home, cleaning, gadgets, and personal care from the live catalogue. The banner above opens the shop.</p>
      </div>
      <div className="mx-auto grid w-full gap-3 px-4 py-4 sm:px-6 md:grid-cols-3">
        <p className="text-sm leading-6 text-forest-900"><span className="font-semibold">Cash on delivery.</span> The order stays unpaid until the store records that payment was collected.</p>
        <p className="text-sm leading-6 text-forest-900"><span className="font-semibold">Shipping {formatINR(SHIPPING_FLAT_RUPEES)}.</span> Free when the payable product total reaches {formatINR(FREE_SHIPPING_ABOVE)}. No delivery date is promised.</p>
        <p className="text-sm leading-6 text-forest-900"><Link href="/returns" className="font-semibold underline">Returns</Link> and <Link href="/shipping-policy" className="font-semibold underline">shipping</Link> use the same rules as checkout.</p>
      </div>
      {links.length > 0 ? (
        <div className="mx-auto w-full px-4 pb-4 sm:px-6">
          <h2 className="font-display text-2xl text-forest-900">Browse the catalogue</h2>
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {links.map((link) => (
              <li key={link.href} className="shrink-0">
                <Link href={link.href} className="block min-h-11 rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2">
                  <span className="block text-sm font-semibold text-forest-900">{link.title}</span>
                  <span className="block text-xs text-muted">{link.note}</span>
                </Link>
              </li>
            ))}
            <li className="shrink-0">
              <Link href="/best-sellers" className="block min-h-11 rounded-2xl border border-forest-800 bg-forest-800 px-4 py-2 text-cream-50">
                <span className="block text-sm font-semibold">Best picks</span>
                <span className="block text-xs text-cream-100">Products customers have ordered</span>
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
