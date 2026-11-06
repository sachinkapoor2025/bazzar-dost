import assert from "node:assert/strict";
import test from "node:test";
import { isAdminRole, roleForEmail } from "../src/lib/staff";

test("admin role is granted only from the server allowlist", () => {
  assert.equal(roleForEmail("gungun.kalra@mydgv.com", ""), "admin");
  assert.equal(roleForEmail("Gungun.Kalra@MyDGV.com", ""), "admin");
  assert.equal(roleForEmail("gungun.kalra@mydgv.com.attacker.test", ""), "customer");
  assert.equal(roleForEmail("shopper@example.com", ""), "customer");
  assert.equal(roleForEmail("shopper@example.com", "shopper@example.com, other@example.com"), "admin");
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isAdminRole("customer"), false);
  assert.equal(isAdminRole(undefined), false);
});
