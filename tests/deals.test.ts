import assert from "node:assert/strict";
import test from "node:test";
import { discountPercent } from "../src/lib/commerce";
import { dealIsOpen, endOfStoreDay, formatCountdown, selectDailyDeals, type DealCard } from "../src/lib/deals";

function deal(price: number, compareAtPrice: number | null, fromPrice = false): DealCard {
  return { price, compareAtPrice, fromPrice };
}

test("store day ends at the next midnight in India", () => {
  const afternoon = new Date("2026-11-04T16:30:00+05:30");
  assert.equal(endOfStoreDay(afternoon).toISOString(), new Date("2026-11-05T00:00:00+05:30").toISOString());
  const justBefore = new Date("2026-11-04T23:59:59+05:30");
  assert.equal(endOfStoreDay(justBefore).toISOString(), new Date("2026-11-05T00:00:00+05:30").toISOString());
  const midnight = new Date("2026-11-05T00:00:00+05:30");
  assert.equal(endOfStoreDay(midnight).toISOString(), new Date("2026-11-06T00:00:00+05:30").toISOString());
});

test("countdown formats the time left", () => {
  assert.equal(formatCountdown(3_661_000), "01:01:01");
  assert.equal(formatCountdown(0), "00:00:00");
  assert.equal(formatCountdown(-40), "00:00:00");
});

test("keeps active discounts and hides a deal after it expires", () => {
  const products = [
    deal(179, 249),
    deal(249, 249),
    deal(300, 249),
    deal(100, 200, true),
  ];
  const during = selectDailyDeals(products, new Date("2026-11-04T18:00:00+05:30"), 8);
  assert.equal(during.items.length, 1);
  assert.equal(during.items[0]?.price, 179);
  assert.equal(during.items[0]?.compareAtPrice, 249);
  assert.equal(discountPercent(179, 249), 28);
  const deadline = new Date(during.endsAt || 0);
  assert.equal(deadline.toISOString(), new Date("2026-11-05T00:00:00+05:30").toISOString());
  assert.equal(dealIsOpen(new Date("2026-11-04T23:59:59+05:30"), deadline), true);
  assert.equal(dealIsOpen(deadline, deadline), false);
});
