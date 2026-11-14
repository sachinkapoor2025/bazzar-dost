import { FeaturedToggle } from "@/components/featured-toggle";
import { PromotionManager } from "@/components/promo-forms";
import { prisma } from "@/lib/db";

export default async function PromotionsPage() {
  const [items, featured] = await Promise.all([
    prisma.promotion.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, isFeatured: true }, take: 80 }),
  ]);
  return (
    <div>
      <h1 className="mb-2 font-display text-4xl">Website content</h1>
      <p className="mb-4 text-sm text-muted">Announcements and banners appear on the storefront as written. Featured products are the ones marked for the homepage. A discount is shown only when that product’s compare-at price is higher than its selling price.</p>
      <PromotionManager items={items} />
      <h2 className="mb-2 mt-8 font-display text-2xl">Featured products</h2>
      <ul className="space-y-2 text-sm">
        {featured.map((product) => (
          <li key={product.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2">
            <span>{product.name}</span>
            <FeaturedToggle id={product.id} featured={product.isFeatured} />
          </li>
        ))}
      </ul>
    </div>
  );
}
