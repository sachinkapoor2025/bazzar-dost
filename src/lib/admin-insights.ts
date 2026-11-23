import "server-only";
import { listRecords } from "@/lib/admin-records";
import { parseAdminRange } from "@/lib/admin-range";
import { summarizeVisits, type VisitPoint } from "@/lib/visit-report";
import { databaseConfigured, databaseHasProducts, readDatabase } from "@/lib/db";
import { loadEngagementScores } from "@/lib/engagement";
import { localQuery } from "@/lib/local-catalogue";
import { listLocalOrders } from "@/lib/local-orders";

export type SaleRow = {
  slug: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  views: number;
  qty: number;
  revenue: number;
};

type OrderSlice = {
  id: string;
  orderNumber: string;
  email: string;
  name: string;
  status: string;
  paymentStatus: string;
  total: number;
  city: string;
  state: string;
  createdAt: Date;
  items: Array<{ name: string; qty: number; unitPrice: number; productId: string | null }>;
};

async function loadOrders(): Promise<OrderSlice[]> {
  if (!databaseConfigured()) {
    return listLocalOrders().map((order) => ({
      ...order,
      createdAt: new Date(order.createdAt),
      items: order.items.map((item) => ({ name: item.name, qty: item.qty, unitPrice: item.unitPrice, productId: item.productId })),
    }));
  }
  return readDatabase([], (client) => client.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: {
      id: true,
      orderNumber: true,
      email: true,
      name: true,
      status: true,
      paymentStatus: true,
      total: true,
      city: true,
      state: true,
      createdAt: true,
      items: { select: { name: true, qty: true, unitPrice: true, productId: true } },
    },
  }));
}

export async function loadProductSales(query = ""): Promise<SaleRow[]> {
  const needle = query.trim().toLowerCase();
  const [orders, scores] = await Promise.all([loadOrders(), loadEngagementScores()]);
  const sold = new Map<string, { qty: number; revenue: number }>();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    for (const item of order.items) {
      const key = item.productId || item.name;
      const current = sold.get(key) || { qty: 0, revenue: 0 };
      current.qty += item.qty;
      current.revenue += item.unitPrice * item.qty;
      sold.set(key, current);
    }
  }

  let rows: SaleRow[] = [];
  if (await databaseHasProducts()) {
    const products = await readDatabase([], (client) => client.product.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true, sku: true, stock: true, viewCount: true, category: { select: { name: true } } },
      orderBy: { name: "asc" },
      take: 1000,
    }));
    rows = products.map((product) => {
      const units = sold.get(product.id) || { qty: 0, revenue: 0 };
      const engagement = scores.get(product.slug);
      return {
        slug: product.slug,
        name: product.name,
        sku: product.sku,
        category: product.category.name,
        stock: product.stock,
        views: Math.max(product.viewCount, engagement?.views || 0),
        qty: units.qty,
        revenue: units.revenue,
      };
    });
  } else {
    const catalogue = localQuery({ page: 1, take: 1000 });
    rows = catalogue.items.map((product) => {
      const units = sold.get(product.id) || sold.get(product.name) || { qty: 0, revenue: 0 };
      return {
        slug: product.slug,
        name: product.name,
        sku: product.sku,
        category: product.categoryName,
        stock: product.stock,
        views: scores.get(product.slug)?.views || 0,
        qty: units.qty,
        revenue: units.revenue,
      };
    });
  }
  if (!needle) return rows;
  return rows.filter((row) => [row.name, row.sku, row.category, row.slug].some((value) => value.toLowerCase().includes(needle)));
}

export async function loadOrderRoutes() {
  const orders = (await loadOrders()).filter((order) => order.status !== "cancelled");
  const grouped = new Map<string, { state: string; city: string; orders: number; revenue: number }>();
  for (const order of orders) {
    const state = order.state || "Unknown";
    const city = order.city || "Unknown";
    const key = `${state}::${city}`;
    const current = grouped.get(key) || { state, city, orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += order.total;
    grouped.set(key, current);
  }
  return [...grouped.values()].sort((a, b) => b.revenue - a.revenue);
}

export async function loadVisitReport(input?: { range?: string; from?: string; to?: string }) {
  const { range, start, end } = parseAdminRange(input || {});
  const visits = await listRecords("visit", 2000);
  const points: VisitPoint[] = visits.map((visit) => ({
    createdAt: visit.createdAt,
    path: String(visit.payload.path || visit.title || "/"),
    sessionId: String(visit.payload.sessionId || visit.id),
    device: String(visit.payload.device || "desktop"),
    referrer: String(visit.payload.referrer || ""),
    country: String(visit.payload.country || ""),
  }));
  return { range, start, end, ...summarizeVisits(points, start, end) };
}

export async function loadGstInvoices() {
  const orders = (await loadOrders()).filter((order) => order.status !== "cancelled");
  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    name: order.name,
    email: order.email,
    paymentStatus: order.paymentStatus,
    state: order.state,
    total: order.total,
  }));
}

export async function loadReconciliation() {
  const orders = await loadOrders();
  const active = orders.filter((order) => order.status !== "cancelled");
  const sum = (rows: OrderSlice[]) => rows.reduce((total, order) => total + order.total, 0);
  const paid = active.filter((order) => order.paymentStatus === "paid");
  const unpaid = active.filter((order) => order.paymentStatus === "unpaid");
  const refunded = active.filter((order) => order.paymentStatus === "refunded");
  return {
    paid: { count: paid.length, amount: sum(paid) },
    unpaid: { count: unpaid.length, amount: sum(unpaid) },
    refunded: { count: refunded.length, amount: sum(refunded) },
  };
}
