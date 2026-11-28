import assert from "node:assert/strict";
import test from "node:test";
import { effectiveRole, isAdminRole, roleForEmail } from "../src/lib/staff";

test("admin role is granted only from the server allowlist", () => {
  assert.equal(roleForEmail("gungun.kalra@mydgv.com", ""), "admin");
  assert.equal(roleForEmail("gungun.kalra@dgv.com", ""), "admin");
  assert.equal(roleForEmail("bazaardost.info@gmail.com", ""), "admin");
  assert.equal(roleForEmail("BazaarDost.Info@gmail.com", ""), "admin");
  assert.equal(roleForEmail("Gungun.Kalra@MyDGV.com", ""), "admin");
  assert.equal(roleForEmail("gungun.kalra@mydgv.com.attacker.test", ""), "customer");
  assert.equal(roleForEmail("shopper@example.com", ""), "customer");
  assert.equal(roleForEmail("shopper@example.com", "shopper@example.com, other@example.com"), "admin");
  assert.equal(isAdminRole("admin"), true);
  assert.equal(isAdminRole("customer"), false);
  assert.equal(isAdminRole(undefined), false);
  assert.equal(effectiveRole("bazaardost.info@gmail.com", "customer"), "admin");
  assert.equal(effectiveRole("  BazaarDost.Info@gmail.com  ", "customer"), "admin");
  assert.equal(effectiveRole("shopper@example.com", "admin"), "admin");
  assert.equal(effectiveRole("shopper@example.com", "customer"), "customer");
});
