import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";

function csv(rows: string[][]): string {
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const type = new URL(request.url).searchParams.get("type");
    let body = "";
    let name = "bazaardost.csv";
    if (type === "products") {
      const products = await prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } });
      body = csv([
        ["sku", "name", "category", "price", "compareAtPrice", "stock", "active"],
        ...products.map((product) => [product.sku, product.name, product.category.name, String(product.price), product.compareAtPrice ? String(product.compareAtPrice) : "", String(product.stock), product.isActive ? "yes" : "no"]),
      ]);
      name = "bazaardost-products.csv";
    } else if (type === "orders") {
      const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 2000 });
      body = csv([
        ["orderNumber", "createdAt", "name", "email", "status", "paymentStatus", "total"],
        ...orders.map((order) => [order.orderNumber, order.createdAt.toISOString(), order.name, order.email, order.status, order.paymentStatus, String(order.total)]),
      ]);
      name = "bazaardost-orders.csv";
    } else if (type === "customers") {
      const customers = await prisma.user.findMany({ where: { role: "customer" }, orderBy: { createdAt: "desc" } });
      body = csv([
        ["name", "email", "phone", "createdAt"],
        ...customers.map((customer) => [customer.name, customer.email, customer.phone, customer.createdAt.toISOString()]),
      ]);
      name = "bazaardost-customers.csv";
    } else if (type === "payments") {
      const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 2000 });
      body = csv([
        ["orderNumber", "method", "status", "currency", "amount"],
        ...orders.map((order) => [order.orderNumber, order.paymentMethod, order.paymentStatus, "INR", String(order.total)]),
      ]);
      name = "bazaardost-payments.csv";
    } else {
      return NextResponse.json({ error: "Choose products, orders, customers, or payments." }, { status: 400 });
    }
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
