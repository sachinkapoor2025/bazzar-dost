import "server-only";
import { databaseConfigured, prisma } from "@/lib/db";
import { listLocalOrders } from "@/lib/local-orders";
import { findLocalProduct } from "@/lib/local-catalogue";

/** Units sold on orders that were not cancelled, keyed by product slug and id. Null when sales cannot be read. */
export async function loadSoldUnits(): Promise<Map<string, number> | null> {
  if (!databaseConfigured()) {
    const units = new Map<string, number>();
    for (const order of listLocalOrders()) {
      if (order.status === "cancelled") continue;
      for (const item of order.items) {
        if (!item.productId || item.qty <= 0) continue;
        units.set(item.productId, (units.get(item.productId) || 0) + item.qty);
        const product = findLocalProduct(item.productId);
        if (product) units.set(product.slug, (units.get(product.slug) || 0) + item.qty);
      }
    }
    return units;
  }
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
