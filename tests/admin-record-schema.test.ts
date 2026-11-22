import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SHIPPING, parseAdminWrite, shippingSettingsSchema } from "../src/lib/admin-record-schema";
import { shippingFromRules } from "../src/lib/commerce";

test("shipping rules keep the store defaults and honor a saved rate", () => {
  assert.equal(shippingFromRules(500), 49);
  assert.equal(shippingFromRules(999), 0);
  assert.equal(shippingFromRules(500, { flat: 20, freeAbove: 100 }), 0);
  assert.equal(shippingFromRules(80, { flat: 20, freeAbove: 100 }), 20);
});

test("vendor records need a name", () => {
  assert.throws(() => parseAdminWrite("vendor", { title: "A", status: "active" }));
  const saved = parseAdminWrite("vendor", { title: "Mill", status: "active", phone: "9876543210", city: "Jaipur", notes: "" });
  assert.equal(saved.title, "Mill");
  assert.equal(saved.payload.city, "Jaipur");
  assert.equal(saved.status, "active");
});

test("shipping settings reject a short PIN", () => {
  const parsed = shippingSettingsSchema.safeParse({ ...DEFAULT_SHIPPING, originPincode: "12" });
  assert.equal(parsed.success, false);
});
