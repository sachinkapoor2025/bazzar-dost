import "server-only";
import { readDatabase } from "@/lib/db";
import { dayKey, parseAdminRange } from "@/lib/admin-range";
import { listLocalCustomers } from "@/lib/account-store";
import { localActiveProductCount, localLowStock } from "@/lib/local-catalogue";
import { listLocalOrders } from "@/lib/local-orders";

const LOW_STOCK = 5;

export async function loadAdminOverview(input: { range?: string; from?: string; to?: string }) {
  const { range, start, end } = parseAdminRange(input);
  const created = { gte: start, lte: end };
  const loaded = await readDatabase(
    { orders: [], productCount: 0, customerCount: 0, lowStock: [], recentOrders: [], recentCustomers: [], sold: [] as Array<{ productId: string | null; name: string; _sum: { qty: number | null } }> },
    async (client) => {
      const [orders, productCount, customerCount, lowStock, recentOrders, recentCustomers] = await Promise.all([
        client.order.findMany({
          where: { createdAt: created },
          select: { id: true, orderNumber: true, name: true, email: true, status: true, paymentStatus: true, total: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        }),
        client.product.count(),
        client.user.count({ where: { role: "customer" } }),
        client.product.findMany({
          where: { isActive: true, OR: [{ variants: { none: {} }, stock: { lte: LOW_STOCK } }, { variants: { some: { stock: { lte: LOW_STOCK } } } }] },
          select: { id: true, name: true, sku: true, stock: true, variants: { select: { stock: true } } },
          take: 8,
          orderBy: { stock: "asc" },
        }),
        client.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { id: true, orderNumber: true, name: true, status: true, total: true, createdAt: true },
        }),
        client.user.findMany({
          where: { role: "customer" },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { id: true, name: true, email: true, createdAt: true, _count: { select: { orders: true } } },
        }),
      ]);
      const sold = await client.orderItem.groupBy({
        by: ["productId", "name"],
        where: { order: { createdAt: created, status: { not: "cancelled" } } },
        _sum: { qty: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 8,
      });
      return { orders, productCount, customerCount, lowStock, recentOrders, recentCustomers, sold };
    },
  );
  let { orders, productCount, customerCount, lowStock, recentOrders, recentCustomers, sold } = loaded;
  if (productCount === 0) {
    productCount = localActiveProductCount();
    lowStock = localLowStock(8).map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock: product.variants.length ? Math.min(...product.variants.map((variant) => variant.stock)) : product.stock,
      variants: product.variants.map((variant) => ({ stock: variant.stock })),
    }));
  }
  if (orders.length === 0) {
    const inRange = listLocalOrders().filter((order) => {
      const created = new Date(order.createdAt);
      return created >= start && created <= end;
    });
    if (inRange.length > 0) {
      orders = inRange.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        name: order.name,
        email: order.email,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        createdAt: new Date(order.createdAt),
      }));
      recentOrders = listLocalOrders().slice(0, 8).map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        name: order.name,
        status: order.status,
        total: order.total,
        createdAt: new Date(order.createdAt),
      }));
      const qty = new Map<string, { productId: string | null; name: string; qty: number }>();
      for (const order of inRange) {
        if (order.status === "cancelled") continue;
        for (const item of order.items) {
          const key = `${item.productId || ""}:${item.name}`;
          const current = qty.get(key) || { productId: item.productId, name: item.name, qty: 0 };
          current.qty += item.qty;
          qty.set(key, current);
        }
      }
      sold = [...qty.values()].sort((a, b) => b.qty - a.qty).slice(0, 8).map((item) => ({
        productId: item.productId,
        name: item.name,
        _sum: { qty: item.qty },
      }));
    }
  }
  if (customerCount === 0) {
    const customers = listLocalCustomers();
    customerCount = customers.length;
    const localOrders = listLocalOrders();
    recentCustomers = customers.slice(0, 6).map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      createdAt: customer.createdAt ?? new Date(0),
      _count: {
        orders: localOrders.filter((order) => order.userId === customer.id || order.email.toLowerCase() === customer.email.toLowerCase()).length,
      },
    }));
  }

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
    statusCounts: ["placed", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"].map((status) => ({
      status,
      count: orders.filter((order) => order.status === status).length,
    })),
  };
}
