import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { databaseConfigured, prisma } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!databaseConfigured()) return NextResponse.json({ error: "User deletion is available when the database is connected." }, { status: 503 });
    const { id } = await context.params;
    if (id === admin.id) return NextResponse.json({ error: "You cannot delete the account you are signed in with." }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id }, include: { _count: { select: { orders: true } } } });
    if (!user) return NextResponse.json({ error: "That user was not found." }, { status: 404 });
    if (user.role === "admin") return NextResponse.json({ error: "Staff accounts are not deleted from this page." }, { status: 400 });
    if (user._count.orders > 0) return NextResponse.json({ error: "This customer has orders, so the account stays on record." }, { status: 400 });
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "User deleted." });
  } catch (error) {
    return errorResponse(error);
  }
}
