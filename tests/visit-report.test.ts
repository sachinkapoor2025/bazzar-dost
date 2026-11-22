import assert from "node:assert/strict";
import test from "node:test";
import { cleanCountry, cleanReferrer, summarizeVisits } from "../src/lib/visit-report";

const now = new Date("2026-11-22T12:00:00.000Z");

test("referrer keeps the host and path and drops the query", () => {
  assert.equal(cleanReferrer("https://news.example.com/story?utm=1"), "news.example.com/story");
  assert.equal(cleanReferrer("javascript:alert(1)"), "");
  assert.equal(cleanReferrer(""), "");
});

test("country is a two-letter code or blank", () => {
  assert.equal(cleanCountry(" in "), "IN");
  assert.equal(cleanCountry("India"), "");
  assert.equal(cleanCountry(null), "");
});

test("visit summary counts unique visitors, sources, and days from stored rows", () => {
  const report = summarizeVisits([
    { createdAt: "2026-11-22T10:00:00.000Z", path: "/", sessionId: "session-a", device: "mobile", referrer: "news.example.com/story", country: "IN" },
    { createdAt: "2026-11-22T10:05:00.000Z", path: "/shop", sessionId: "session-a", device: "mobile", referrer: "", country: "IN" },
    { createdAt: "2026-11-20T10:00:00.000Z", path: "/", sessionId: "session-b", device: "desktop", referrer: "", country: "" },
    { createdAt: "2026-10-01T10:00:00.000Z", path: "/old", sessionId: "session-c", device: "desktop", referrer: "", country: "" },
  ], new Date("2026-11-01T00:00:00.000Z"), new Date("2026-11-22T23:59:59.999Z"), now);

  assert.equal(report.views, 3);
  assert.equal(report.visitors, 2);
  assert.equal(report.today.views, 2);
  assert.equal(report.today.visitors, 1);
  assert.equal(report.week.views, 3);
  assert.equal(report.byPath[0]?.path, "/");
  assert.equal(report.byPath[0]?.count, 2);
  assert.equal(report.byReferrer.find((row) => row.source === "Direct")?.count, 2);
  assert.equal(report.byReferrer.find((row) => row.source === "news.example.com")?.count, 1);
  assert.equal(report.byCountry.find((row) => row.country === "Not reported")?.count, 1);
  assert.equal(report.sessions[0]?.journey.join(" > "), "/ > /shop");
  assert.equal(report.days.some((day) => day.views === 2), true);
});
