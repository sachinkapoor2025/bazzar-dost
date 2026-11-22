import { dayKey } from "@/lib/admin-range";

export type VisitPoint = {
  createdAt: string;
  path: string;
  sessionId: string;
  device: string;
  referrer: string;
  country: string;
};

export function cleanReferrer(value: string): string {
  const trimmed = value.trim().slice(0, 300);
  if (!trimmed) return "";
  try {
    const url = trimmed.includes("://") ? new URL(trimmed) : null;
    if (!url) return "";
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    const path = url.pathname === "/" ? "" : url.pathname;
    return `${url.hostname}${path}`.slice(0, 180);
  } catch {
    return "";
  }
}

export function cleanCountry(value: string | null | undefined): string {
  const code = (value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "";
}

export function deviceFromUserAgent(userAgent: string, fallback: "mobile" | "tablet" | "desktop"): "mobile" | "tablet" | "desktop" {
  const value = userAgent.toLowerCase();
  if (!value) return fallback;
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(value)) return "tablet";
  if (/mobi|iphone|ipod|android|phone/.test(value)) return "mobile";
  return "desktop";
}

type SessionRow = {
  sessionId: string;
  device: string;
  country: string;
  referrer: string;
  views: number;
  lastPath: string;
  lastAt: string;
  journey: string[];
};

export function summarizeVisits(visits: VisitPoint[], start: Date, end: Date, now = new Date()) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  const inWindow = (iso: string, from: Date, to: Date) => {
    const time = Date.parse(iso);
    return !Number.isNaN(time) && time >= from.getTime() && time <= to.getTime();
  };
  const dayStart = (daysBack: number) => {
    const value = new Date(now);
    value.setHours(0, 0, 0, 0);
    value.setDate(value.getDate() - (daysBack - 1));
    return value;
  };
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);
  const totals = (from: Date, to: Date) => {
    const rows = visits.filter((visit) => inWindow(visit.createdAt, from, to));
    return { views: rows.length, visitors: new Set(rows.map((row) => row.sessionId)).size };
  };

  const selected = visits.filter((visit) => inWindow(visit.createdAt, start, end));
  const byPath = new Map<string, number>();
  const byDevice = new Map<string, number>();
  const byReferrer = new Map<string, number>();
  const byCountry = new Map<string, number>();
  const byDay = new Map<string, number>();
  const sessions = new Map<string, SessionRow>();

  const ordered = [...selected].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const visit of ordered) {
    const path = visit.path || "/";
    const device = visit.device || "desktop";
    const source = visit.referrer ? visit.referrer.split("/")[0] || "Direct" : "Direct";
    const country = visit.country || "Not reported";
    byPath.set(path, (byPath.get(path) || 0) + 1);
    byDevice.set(device, (byDevice.get(device) || 0) + 1);
    byReferrer.set(source, (byReferrer.get(source) || 0) + 1);
    byCountry.set(country, (byCountry.get(country) || 0) + 1);
    const key = dayKey(new Date(visit.createdAt));
    byDay.set(key, (byDay.get(key) || 0) + 1);
    const current = sessions.get(visit.sessionId) || {
      sessionId: visit.sessionId,
      device,
      country,
      referrer: source,
      views: 0,
      lastPath: path,
      lastAt: visit.createdAt,
      journey: [],
    };
    current.views += 1;
    current.device = device;
    current.country = country;
    current.lastPath = path;
    current.lastAt = visit.createdAt;
    if (current.journey[current.journey.length - 1] !== path) current.journey.push(path);
    if (current.journey.length > 12) current.journey.shift();
    sessions.set(visit.sessionId, current);
  }

  const days: Array<{ day: string; views: number }> = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cursor.getTime() <= last.getTime() && days.length < 400) {
    const key = dayKey(cursor);
    days.push({ day: key, views: byDay.get(key) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  const chart = days.slice(-62);
  const ranked = (map: Map<string, number>) => [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  const sessionRows = [...sessions.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  const liveCutoff = now.getTime() - 15 * 60 * 1000;

  return {
    views: selected.length,
    visitors: sessions.size,
    today: totals(dayStart(1), dayEnd),
    week: totals(dayStart(7), dayEnd),
    month: totals(dayStart(30), dayEnd),
    byPath: ranked(byPath).map((row) => ({ path: row.label, count: row.count })),
    byDevice: ranked(byDevice).map((row) => ({ device: row.label, count: row.count })),
    byReferrer: ranked(byReferrer).map((row) => ({ source: row.label, count: row.count })),
    byCountry: ranked(byCountry).map((row) => ({ country: row.label, count: row.count })),
    days: chart,
    chartTruncated: days.length > chart.length,
    sessions: sessionRows,
    live: sessionRows.filter((session) => Date.parse(session.lastAt) >= liveCutoff && Date.parse(session.lastAt) >= startMs && Date.parse(session.lastAt) <= endMs),
  };
}
