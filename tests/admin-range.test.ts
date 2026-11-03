import assert from "node:assert/strict";
import test from "node:test";
import { parseAdminRange } from "../src/lib/admin-range";

const now = new Date("2026-11-03T15:00:00");

test("today starts at midnight", () => {
  const range = parseAdminRange({ range: "today" }, now);
  assert.equal(range.range, "today");
  assert.equal(range.start.getDate(), 3);
  assert.equal(range.start.getHours(), 0);
});

test("custom dates are inclusive", () => {
  const range = parseAdminRange({ range: "custom", from: "2026-10-01", to: "2026-10-02" }, now);
  assert.equal(range.range, "custom");
  assert.equal(range.start.getMonth(), 9);
  assert.equal(range.end.getDate(), 2);
});

test("an invalid custom range falls back to 30 days", () => {
  const range = parseAdminRange({ range: "custom", from: "nope", to: "nope" }, now);
  assert.equal(range.range, "30d");
});
