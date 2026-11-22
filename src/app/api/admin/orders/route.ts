import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { databaseConfigured, readDatabase } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { listLocalOrders } from "@/lib/local-orders";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const status = url.searchParams.get("status") || "";
    const orders = databaseConfigured()
      ? await readDatabase([], (client) => client.order.findMany({
          where: status ? { status } : undefined,
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, orderNumber: true, name: true, email: true, status: true, paymentStatus: true, total: true, city: true, state: true, trackingNote: true, createdAt: true },
        }))
      : listLocalOrders().filter((order) => !status || order.status === status).slice(0, 50);
    const filtered = q
      ? orders.filter((order) => [order.orderNumber, order.name, order.email, order.city, order.state].some((value) => String(value).toLowerCase().includes(q)))
      : orders;
    return NextResponse.json({
      orders: filtered.map((order) => ({ ...order, createdAt: new Date(order.createdAt).toISOString() })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
