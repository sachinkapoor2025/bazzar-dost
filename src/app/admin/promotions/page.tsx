import { PromotionManager } from "@/components/promo-forms";
import { api } from "@/lib/backend";

export default async function PromotionsPage() {
  const items = await api<Array<{ id: string; title: string; message: string; href: string; kind: string; active: boolean }>>("/admin/promotions");
  return (
    <div>
      <h1 className="mb-2 font-display text-4xl">Promotions</h1>
      <p className="mb-4 text-sm text-muted">Announcement text is shown as written. Do not enter a discount that the catalogue prices do not support.</p>
      <PromotionManager items={items} />
    </div>
  );
}
