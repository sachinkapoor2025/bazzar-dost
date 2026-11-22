import { NextResponse } from "next/server";
import { loadGstInvoices, loadProductSales } from "@/lib/admin-insights";
import { requireAdmin } from "@/lib/auth";
import { databaseConfigured, prisma } from "@/lib/db";
import { listNewsletterSubscribers } from "@/lib/inquiry-store";
import { errorResponse } from "@/lib/http";
import { loadGstSettings } from "@/lib/shipping-settings";

function csv(rows: string[][]): string {
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const type = new URL(request.url).searchParams.get("type");
    if (["products", "orders", "customers", "payments"].includes(type || "") && !databaseConfigured()) {
      return NextResponse.json({ error: "That export needs the shop database." }, { status: 503 });
    }
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
    } else if (type === "product-sales") {
      const rows = await loadProductSales();
      body = csv([
        ["sku", "name", "category", "stock", "views", "sold", "revenue"],
        ...rows.map((row) => [row.sku, row.name, row.category, String(row.stock), String(row.views), String(row.qty), String(row.revenue)]),
      ]);
      name = "bazaardost-product-sales.csv";
    } else if (type === "gst") {
      const [settings, invoices] = await Promise.all([loadGstSettings(), loadGstInvoices()]);
      body = csv([
        ["invoice", "date", "customer", "state", "payment", "taxable", "gst", "total"],
        ...invoices.map((invoice) => {
          const gst = settings.ratePercent ? Math.round((invoice.total * settings.ratePercent) / (100 + settings.ratePercent)) : 0;
          return [invoice.orderNumber, invoice.createdAt.toISOString(), invoice.name, invoice.state, invoice.paymentStatus, String(invoice.total - gst), String(gst), String(invoice.total)];
        }),
      ]);
      name = "bazaardost-gst.csv";
    } else if (type === "subscribers") {
      const rows = await listNewsletterSubscribers();
      body = csv([
        ["email", "createdAt"],
        ...rows.map((row) => [row.email, row.createdAt]),
      ]);
      name = "bazaardost-subscribers.csv";
    } else if (type === "payments") {
      const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 2000 });
      body = csv([
        ["orderNumber", "method", "status", "currency", "amount"],
        ...orders.map((order) => [order.orderNumber, order.paymentMethod, order.paymentStatus, "INR", String(order.total)]),
      ]);
      name = "bazaardost-payments.csv";
    } else {
      return NextResponse.json({ error: "Choose products, orders, customers, payments, subscribers, product-sales, or gst." }, { status: 400 });
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
