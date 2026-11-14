import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";

const rowSchema = z.object({
  sku: z.string().trim().min(2).max(40),
  price: z.number().int().positive(),
  stock: z.number().int().min(0).max(100000),
  active: z.boolean(),
});

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const [header, ...rows] = lines;
  const columns = (header || "").split(",").map((column) => column.trim().toLowerCase());
  const index = (name: string) => columns.indexOf(name);
  if (index("sku") < 0 || index("price") < 0 || index("stock") < 0) {
    return { error: "The CSV needs sku, price, and stock columns." as const, rows: [] };
  }
  return {
    rows: rows.map((line) => {
      const cells = line.split(",").map((cell) => cell.trim());
      const activeCell = index("active") >= 0 ? cells[index("active")]?.toLowerCase() : "yes";
      return {
        sku: cells[index("sku")] || "",
        price: Number(cells[index("price")]),
        stock: Number(cells[index("stock")]),
        active: activeCell !== "no" && activeCell !== "false" && activeCell !== "0",
      };
    }),
  };
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = z.object({ csv: z.string().min(1).max(200000) }).parse(await request.json());
    const parsed = parseCsv(body.csv);
    if ("error" in parsed && parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
    let updated = 0;
    const unknown: string[] = [];
    const invalid: string[] = [];
    for (const row of parsed.rows) {
      const checked = rowSchema.safeParse(row);
      if (!checked.success) {
        invalid.push(row.sku || "row");
        continue;
      }
      const result = await prisma.product.updateMany({
        where: { sku: checked.data.sku },
        data: { price: checked.data.price, stock: checked.data.stock, isActive: checked.data.active },
      });
      if (result.count === 0) unknown.push(checked.data.sku);
      else updated += result.count;
    }
    return NextResponse.json({
      message: `Updated ${updated} products.${unknown.length ? ` Unknown SKU: ${unknown.slice(0, 8).join(", ")}.` : ""}${invalid.length ? ` Skipped ${invalid.length} invalid rows.` : ""}`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
