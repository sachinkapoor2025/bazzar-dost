import "server-only";
import fs from "node:fs";
import path from "node:path";
import { emptyScore, type EngagementScore } from "@/lib/trending";

const FILE = path.join(process.cwd(), "data", "engagement.json");
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

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

export async function recordEngagement(slug: string, kind: "view" | "click") {
  const clean = normalizeSlug(slug);
  if (!clean) return;
  try {
    const store = readStore();
    const current = store[clean] || { views: 0, clicks: 0 };
    if (kind === "view") current.views += 1;
    else current.clicks += 1;
    store[clean] = current;
    writeStore(store);
  } catch (error) {
    console.error(error);
  }
}

export async function loadEngagementScores(): Promise<Map<string, EngagementScore>> {
  const scores = new Map<string, EngagementScore>();
  for (const [slug, counts] of Object.entries(readStore())) {
    const current = scores.get(slug) || emptyScore();
    current.views = counts.views;
    current.clicks = counts.clicks;
    if (current.views || current.clicks) scores.set(slug, current);
  }
  return scores;
}
