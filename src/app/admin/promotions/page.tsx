import { PromotionManager } from "@/components/promo-forms";
import { prisma } from "@/lib/db";

export default async function PromotionsPage() {
  const items = await prisma.promotion.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="mb-2 font-display text-4xl">Promotions</h1>
      <p className="mb-4 text-sm text-muted">Announcement text is shown as written. Do not enter a discount that the catalogue prices do not support.</p>
      <PromotionManager items={items} />
    </div>
  );
}
