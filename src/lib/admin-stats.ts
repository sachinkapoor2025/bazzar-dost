import "server-only";
import { prisma } from "@/lib/db";
import { dayKey, parseAdminRange } from "@/lib/admin-range";

const LOW_STOCK = 5;

export async function loadAdminOverview(input: { range?: string; from?: string; to?: string }) {
  const { range, start, end } = parseAdminRange(input);
  const created = { gte: start, lte: end };
  const [orders, productCount, customerCount, lowStock, recentOrders, recentCustomers] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: created },
      select: { id: true, orderNumber: true, name: true, email: true, status: true, paymentStatus: true, total: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count(),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.product.findMany({
      where: { isActive: true, OR: [{ variants: { none: {} }, stock: { lte: LOW_STOCK } }, { variants: { some: { stock: { lte: LOW_STOCK } } } }] },
      select: { id: true, name: true, sku: true, stock: true, variants: { select: { stock: true } } },
      take: 8,
      orderBy: { stock: "asc" },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, orderNumber: true, name: true, status: true, total: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { role: "customer" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, createdAt: true, _count: { select: { orders: true } } },
    }),
  ]);

  const activeOrders = orders.filter((order) => order.status !== "cancelled");
  const revenue = activeOrders.reduce((sum, order) => sum + order.total, 0);
  const byDay = new Map<string, { orders: number; revenue: number }>();
  for (const order of orders) {
    const key = dayKey(order.createdAt);
    const current = byDay.get(key) || { orders: 0, revenue: 0 };
    current.orders += 1;
    if (order.status !== "cancelled") current.revenue += order.total;
    byDay.set(key, current);
  }
  const days: Array<{ day: string; orders: number; revenue: number }> = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cursor.getTime() <= last.getTime() && days.length < 62) {
    const key = dayKey(cursor);
    const current = byDay.get(key) || { orders: 0, revenue: 0 };
    days.push({ day: key, orders: current.orders, revenue: current.revenue });
    cursor.setDate(cursor.getDate() + 1);
  }

  const sold = await prisma.orderItem.groupBy({
    by: ["productId", "name"],
    where: { order: { createdAt: created, status: { not: "cancelled" } } },
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 8,
  });

  return {
    range,
    start,
    end,
    totals: {
      orders: orders.length,
      revenue,
      products: productCount,
      customers: customerCount,
      pending: orders.filter((order) => order.status === "placed" || order.status === "confirmed" || order.status === "processing").length,
      completed: orders.filter((order) => order.status === "delivered").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length,
      lowStock: lowStock.length,
    },
    days,
    lowStock: lowStock.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock: product.variants.length ? product.variants.reduce((sum, variant) => sum + variant.stock, 0) : product.stock,
    })),
    bestSellers: sold.map((item) => ({ productId: item.productId, name: item.name, qty: item._sum.qty || 0 })),
    recentOrders,
    recentCustomers,
    statusCounts: ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((status) => ({
      status,
      count: orders.filter((order) => order.status === status).length,
    })),
  };
}
