import "server-only";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/db";
import { emptyScore, type EngagementScore } from "@/lib/trending";

const FILE = path.join(process.cwd(), "data", "engagement.json");
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

function databaseConfigured(): boolean {
  const url = process.env.DATABASE_URL || "";
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

type FileStore = Record<string, { views: number; clicks: number }>;

export function normalizeSlug(slug: string): string | null {
  const clean = slug.trim().toLowerCase();
  if (!clean || clean.length > 180 || !SLUG.test(clean)) return null;
  return clean;
}

function readStore(): FileStore {
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const store: FileStore = {};
    for (const [slug, value] of Object.entries(parsed)) {
      const key = normalizeSlug(slug);
      if (!key || !value || typeof value !== "object") continue;
      const row = value as { views?: unknown; clicks?: unknown };
      const views = typeof row.views === "number" && row.views > 0 ? Math.floor(row.views) : 0;
      const clicks = typeof row.clicks === "number" && row.clicks > 0 ? Math.floor(row.clicks) : 0;
      if (views || clicks) store[key] = { views, clicks };
    }
    return store;
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? (error as { code?: string }).code : "";
    if (code !== "ENOENT") console.error(error);
    return {};
  }
}

function writeStore(store: FileStore) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store));
  fs.copyFileSync(tmp, FILE);
  fs.unlinkSync(tmp);
}

function remember(slug: string, kind: "view" | "click") {
  const store = readStore();
  const current = store[slug] || { views: 0, clicks: 0 };
  if (kind === "view") current.views += 1;
  else current.clicks += 1;
  store[slug] = current;
  writeStore(store);
}

export async function recordEngagement(slug: string, kind: "view" | "click") {
  const clean = normalizeSlug(slug);
  if (!clean) return;
  try {
    remember(clean, kind);
  } catch (error) {
    console.error(error);
  }
  if (!databaseConfigured()) return;
  try {
    await prisma.productEngagement.upsert({
      where: { slug: clean },
      create: { slug: clean, views: kind === "view" ? 1 : 0, clicks: kind === "click" ? 1 : 0 },
      update: kind === "view" ? { views: { increment: 1 } } : { clicks: { increment: 1 } },
    });
  } catch (error) {
    console.error(error);
  }
  if (kind !== "view") return;
  try {
    await prisma.product.updateMany({ where: { slug: clean, isActive: true }, data: { viewCount: { increment: 1 } } });
  } catch (error) {
    console.error(error);
  }
}

function bump(scores: Map<string, EngagementScore>, slug: string, partial: Partial<EngagementScore>) {
  const key = normalizeSlug(slug);
  if (!key) return;
  const current = scores.get(key) || emptyScore();
  current.views = Math.max(current.views, partial.views || 0);
  current.clicks = Math.max(current.clicks, partial.clicks || 0);
  current.orders = Math.max(current.orders, partial.orders || 0);
  current.wishlists = Math.max(current.wishlists, partial.wishlists || 0);
  if (current.views || current.clicks || current.orders || current.wishlists) scores.set(key, current);
}

export async function loadEngagementScores(): Promise<Map<string, EngagementScore>> {
  const scores = new Map<string, EngagementScore>();
  for (const [slug, counts] of Object.entries(readStore())) {
    bump(scores, slug, counts);
  }
  if (!databaseConfigured()) return scores;

  try {
    const rows = await prisma.productEngagement.findMany({
      where: { OR: [{ views: { gt: 0 } }, { clicks: { gt: 0 } }] },
      select: { slug: true, views: true, clicks: true },
    });
    for (const row of rows) bump(scores, row.slug, { views: row.views, clicks: row.clicks });
  } catch (error) {
    console.error(error);
  }

  try {
    const rows = await prisma.product.findMany({
      where: { isActive: true, viewCount: { gt: 0 } },
      select: { slug: true, viewCount: true },
    });
    for (const row of rows) bump(scores, row.slug, { views: row.viewCount });
  } catch (error) {
    console.error(error);
  }

  try {
    const [sold, saved] = await Promise.all([
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: { NOT: { productId: null }, order: { status: { not: "cancelled" } } },
        _sum: { qty: true },
      }),
      prisma.wishlistItem.groupBy({
        by: ["productId"],
        _count: { _all: true },
      }),
    ]);
    const ids = [...new Set([...sold, ...saved].map((row) => row.productId).filter((id): id is string => Boolean(id)))];
    if (ids.length === 0) return scores;
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true, slug: true },
    });
    const slugById = new Map(products.map((product) => [product.id, product.slug]));
    for (const row of sold) {
      if (!row.productId) continue;
      const slug = slugById.get(row.productId);
      if (slug) bump(scores, slug, { orders: row._sum.qty || 0 });
    }
    for (const row of saved) {
      const slug = slugById.get(row.productId);
      if (slug) bump(scores, slug, { wishlists: row._count._all });
    }
  } catch (error) {
    console.error(error);
  }

  return scores;
}
