import { NextResponse } from "next/server";
import { api } from "@/lib/backend";
import { absoluteUrl } from "@/lib/site";

function cell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export async function GET() {
  const products = await api<Array<{ name: string; sku: string; price: number; compareAtPrice: number | null; stock: number; slug: string; category: { name: string } }>>("/catalogue");
  const lines = ["Name,SKU,Category,Selling price INR,Compare-at price INR,Stock,Link"];
  for (const product of products) {
    lines.push(
      [cell(product.name), cell(product.sku), cell(product.category.name), product.price, product.compareAtPrice ?? "", product.stock, cell(absoluteUrl(`/products/${product.slug}`))].join(","),
    );
  }
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bazaardost-catalogue.csv"',
    },
  });
}
