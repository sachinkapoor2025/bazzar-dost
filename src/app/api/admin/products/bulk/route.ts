import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { databaseHasProducts, prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { setLocalProductFlags } from "@/lib/local-catalogue";

const schema = z.object({
  action: z.enum(["activate", "deactivate", "delete"]),
  ids: z.array(z.string().min(1)).min(1).max(100),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    if (!(await databaseHasProducts())) {
      const active = body.action === "activate";
      const updated = body.ids.filter((id) => setLocalProductFlags(id, { isActive: active })).length;
      const message = body.action === "delete"
        ? `Marked ${updated} products inactive. Catalogue products stay in the shop file and can be marked active again.`
        : `Updated ${updated} products.`;
      return NextResponse.json({ message });
    }
    if (body.action === "activate" || body.action === "deactivate") {
      const result = await prisma.product.updateMany({
        where: { id: { in: body.ids } },
        data: { isActive: body.action === "activate" },
      });
      return NextResponse.json({ message: `Updated ${result.count} products.` });
    }
    const blocked: string[] = [];
    let removed = 0;
    for (const id of body.ids) {
      const orders = await prisma.orderItem.count({ where: { productId: id } });
      if (orders > 0) {
        blocked.push(id);
        continue;
      }
      try {
        await prisma.product.delete({ where: { id } });
        removed += 1;
      } catch {
        blocked.push(id);
      }
    }
    const message = blocked.length
      ? `Deleted ${removed}. ${blocked.length} could not be deleted because they are on an order. Mark those inactive instead.`
      : `Deleted ${removed} products.`;
    return NextResponse.json({ message });
  } catch (error) {
    return errorResponse(error);
  }
}
