import { NextResponse } from "next/server";
import { queryCatalog } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

function cell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export async function GET() {
  const lines = ["Name,SKU,Category,Selling price INR,Compare-at price INR,Stock,Link"];
  let page = 1;
  let pageCount = 1;
  do {
    const result = await queryCatalog({ page });
    pageCount = result.pageCount;
    for (const product of result.items) {
      lines.push(
        [
          cell(product.name),
          cell(product.sku),
          cell(product.categoryName),
          product.price,
          product.compareAtPrice ?? "",
          product.stock,
          cell(absoluteUrl(`/products/${product.slug}`)),
        ].join(","),
      );
    }
    page += 1;
  } while (page <= pageCount);
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bazaardost-catalogue.csv"',
    },
  });
}
