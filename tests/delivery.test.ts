import assert from "node:assert/strict";
import test from "node:test";
import { checkPincode } from "../src/lib/delivery";

test("rejects a PIN that is not a 6-digit delivery code", () => {
  assert.equal(checkPincode("12345").ok, false);
  assert.equal(checkPincode("012345").ok, false);
  assert.equal(checkPincode("110001").available, true);
});

test("does not invent a delivery date when no estimate is configured", () => {
  const result = checkPincode("110001", {});
  assert.equal(result.available, true);
  assert.equal(result.estimate, null);
  assert.match(result.message, /not published/i);
});

test("uses configured delivery rules and blocks other PINs", () => {
  const rules = { allowedPrefixes: "400,110", blockedPrefixes: "110001", minDays: "3", maxDays: "5" };
  const blocked = checkPincode("110001", rules);
  assert.equal(blocked.available, false);
  assert.equal(blocked.estimate, null);
  const served = checkPincode("400001", rules);
  assert.equal(served.available, true);
  assert.equal(served.estimate, "3–5 days");
  const outside = checkPincode("560001", rules);
  assert.equal(outside.available, false);
});

test("ignores an incomplete day range instead of showing it", () => {
  const result = checkPincode("560001", { minDays: "3" });
  assert.equal(result.estimate, null);
});
