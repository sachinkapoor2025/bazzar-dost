import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { databaseHasProducts, prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { setLocalProductFlags } from "@/lib/local-catalogue";

const schema = z.object({
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).refine((value) => value.isFeatured !== undefined || value.isActive !== undefined, "Choose a change.");

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const body = schema.parse(await request.json());
    const id = (await context.params).id;
    if (!(await databaseHasProducts())) {
      if (!setLocalProductFlags(id, body)) return NextResponse.json({ error: "Product not found." }, { status: 404 });
      return NextResponse.json({ message: "Product updated." });
    }
    const updated = await prisma.product.updateMany({ where: { id }, data: body });
    if (updated.count !== 1 && !setLocalProductFlags(id, body)) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ message: "Product updated." });
  } catch (error) {
    return errorResponse(error);
  }
}
