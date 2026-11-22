import "server-only";
import { ensureCategoryArt } from "@/lib/admin-catalog";
import { api } from "@/lib/backend";
import { databaseConfigured, isUniqueConstraint, prisma } from "@/lib/db";
import { categorySchema } from "@/lib/validators";

function fail(message: string, status: number): never {
  const error = new Error(message);
  (error as Error & { status?: number }).status = status;
  throw error;
}

export async function persistCategory(input: unknown, id?: string) {
  const parsed = categorySchema.parse(input);
  if (!databaseConfigured()) {
    const { saveCategory } = await import("@/lib/admin-catalog");
    return saveCategory(parsed, id);
  }
  const parentId = parsed.parentId || null;
  if (parentId) {
    if (parentId === id) fail("A category cannot be its own parent.", 400);
    const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { id: true, parentId: true } });
    if (!parent) fail("Choose a parent category that exists.", 400);
    if (id && parent.parentId === id) fail("That parent is already a subcategory of this category.", 400);
  }
  const image = parsed.image || await ensureCategoryArt(parsed.slug, parsed.name);
  const data = {
    name: parsed.name,
    slug: parsed.slug,
    description: parsed.description,
    image,
    sortOrder: parsed.sortOrder,
    parentId,
  };
  try {
    if (id) return await prisma.category.update({ where: { id }, data });
    return await prisma.category.create({ data });
  } catch (error) {
    if (isUniqueConstraint(error)) fail("That slug is already used.", 400);
    throw error;
  }
}

export async function removeCategory(id: string) {
  if (!databaseConfigured()) {
    await api(`/admin/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
    return;
  }
  const [products, children] = await Promise.all([
    prisma.product.count({ where: { categoryId: id } }),
    prisma.category.count({ where: { parentId: id } }),
  ]);
  if (products > 0) fail("Move the products in this category before deleting it.", 400);
  if (children > 0) fail("Move or delete the subcategories first.", 400);
  await prisma.category.delete({ where: { id } });
}
