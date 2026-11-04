import "server-only";
import { prisma } from "@/lib/db";

function databaseConfigured(): boolean {
  const url = process.env.DATABASE_URL || "";
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

/** Units sold on orders that were not cancelled, keyed by product slug and id. Null when sales cannot be read. */
export async function loadSoldUnits(): Promise<Map<string, number> | null> {
  if (!databaseConfigured()) return null;
  try {
    const sold = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: { NOT: { productId: null }, order: { status: { not: "cancelled" } } },
      _sum: { qty: true },
    });
    const ids = sold.map((row) => row.productId).filter((id): id is string => Boolean(id));
    const products = ids.length
      ? await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, slug: true } })
      : [];
    const slugById = new Map(products.map((product) => [product.id, product.slug]));
    const units = new Map<string, number>();
    for (const row of sold) {
      if (!row.productId) continue;
      const qty = row._sum.qty || 0;
      if (qty <= 0) continue;
      units.set(row.productId, (units.get(row.productId) || 0) + qty);
      const slug = slugById.get(row.productId);
      if (slug) units.set(slug, (units.get(slug) || 0) + qty);
    }
    return units;
  } catch (error) {
    console.error(error);
    return null;
  }
}
