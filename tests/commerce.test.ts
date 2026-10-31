import assert from "node:assert/strict";
import test from "node:test";
import {
  couponDiscount,
  discountPercent,
  normalizePriceRange,
  orderTotal,
  parseRupee,
  priceBounds,
  safeNextPath,
  shippingCharge,
} from "../src/lib/commerce";

test("discount badge uses a real higher compare-at price", () => {
  assert.equal(discountPercent(179, 249), 28);
  assert.equal(discountPercent(249, 249), null);
  assert.equal(discountPercent(300, 249), null);
  assert.equal(discountPercent(179, null), null);
});

test("shipping follows the published checkout rule", () => {
  assert.equal(shippingCharge(500), 49);
  assert.equal(shippingCharge(998), 49);
  assert.equal(shippingCharge(999), 0);
  assert.equal(shippingCharge(0), 0);
});

test("coupons cannot discount more than the subtotal", () => {
  assert.equal(couponDiscount(400, { type: "FIXED", value: 50, minSubtotal: 499 }), 0);
  assert.equal(couponDiscount(500, { type: "FIXED", value: 50, minSubtotal: 499 }), 50);
  assert.equal(couponDiscount(80, { type: "FIXED", value: 50, minSubtotal: 0 }), 50);
  assert.equal(couponDiscount(200, { type: "PERCENT", value: 10, minSubtotal: 0 }), 20);
  assert.equal(couponDiscount(200, { type: "PERCENT", value: 200, minSubtotal: 0 }), 180);
  assert.equal(couponDiscount(200, { type: "OTHER", value: 10, minSubtotal: 0 }), 0);
});

test("order total keeps shipping outside the discount", () => {
  assert.equal(orderTotal(500, 50, 49), 499);
  assert.equal(orderTotal(40, 100, 49), 49);
});

test("variant products expose the lower price as a range", () => {
  assert.deepEqual(priceBounds(549, []), { price: 549, from: false });
  assert.deepEqual(priceBounds(549, [549, 699]), { price: 549, from: true });
  assert.deepEqual(priceBounds(349, [null, 599]), { price: 349, from: true });
});

test("price filters reject an inverted range", () => {
  assert.equal(normalizePriceRange(800, 100).error?.length ? true : false, true);
  assert.deepEqual(normalizePriceRange(100, 800), { min: 100, max: 800 });
  assert.equal(parseRupee("199"), 199);
  assert.equal(parseRupee("19a"), undefined);
  assert.equal(parseRupee("-1"), undefined);
});

test("redirect targets stay on this site", () => {
  assert.equal(safeNextPath("/account/orders"), "/account/orders");
  assert.equal(safeNextPath("https://evil.example"), "/account");
  assert.equal(safeNextPath("//evil.example"), "/account");
  assert.equal(safeNextPath(undefined, "/shop"), "/shop");
});
