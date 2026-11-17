import { NextResponse } from "next/server";
import { databaseConfigured, prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { listLocalOrders } from "@/lib/local-orders";
import { trackSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = trackSchema.parse(await request.json());
    const order = databaseConfigured()
      ? await prisma.order.findFirst({
          where: { orderNumber: body.orderNumber.trim().toUpperCase(), email: body.email.toLowerCase() },
          include: { items: true },
        })
      : listLocalOrders().find((item) => item.orderNumber === body.orderNumber.trim().toUpperCase() && item.email === body.email.toLowerCase()) ?? null;
    if (!order) return NextResponse.json({ error: "No order matches those details." }, { status: 404 });
    return NextResponse.json({
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: new Date(order.createdAt).toISOString(),
        total: order.total,
        trackingNote: order.trackingNote,
        items: order.items.map((item) => ({ name: item.name, qty: item.qty })),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
