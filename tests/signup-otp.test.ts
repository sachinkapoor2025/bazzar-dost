import assert from "node:assert/strict";
import test from "node:test";
import { assessOtp, createOtpCode, hashOtp, otpMatches, resendWaitSeconds } from "../src/lib/signup-otp";
import { isAdminRole, roleForEmail } from "../src/lib/staff";

const secret = "test-secret-that-is-at-least-32-characters";

test("otp hash matches only the issued code for that email", () => {
  const code = "048213";
  const hash = hashOtp("Buyer@Example.com", code, secret);
  assert.equal(otpMatches("buyer@example.com", code, secret, hash), true);
  assert.equal(otpMatches("buyer@example.com", "048214", secret, hash), false);
  assert.equal(otpMatches("other@example.com", code, secret, hash), false);
  assert.equal(otpMatches("buyer@example.com", code, "another-secret-that-is-at-least-32", hash), false);
});

test("issued codes are 6 digits", () => {
  for (let index = 0; index < 20; index += 1) {
    assert.match(createOtpCode(), /^\d{6}$/);
  }
});

test("expired and locked codes are rejected before a match", () => {
  const now = Date.parse("2026-11-06T12:00:00.000Z");
  const hash = hashOtp("buyer@example.com", "123456", secret);
  assert.deepEqual(
    assessOtp({
      expiresAt: new Date(now - 1000),
      attempts: 0,
      email: "buyer@example.com",
      otp: "123456",
      secret,
      otpHash: hash,
      now,
    }),
    { ok: false, reason: "expired" },
  );
  assert.deepEqual(
    assessOtp({
      expiresAt: new Date(now + 60_000),
      attempts: 5,
      email: "buyer@example.com",
      otp: "123456",
      secret,
      otpHash: hash,
      now,
    }),
    { ok: false, reason: "locked" },
  );
});

test("a wrong code is invalid and the right code is accepted inside 5 minutes", () => {
  const now = Date.parse("2026-11-06T12:00:00.000Z");
  const hash = hashOtp("buyer@example.com", "123456", secret);
  const base = {
    expiresAt: new Date(now + 5 * 60 * 1000),
    attempts: 4,
    email: "buyer@example.com",
    secret,
    otpHash: hash,
    now,
  };
  assert.deepEqual(assessOtp({ ...base, otp: "000000" }), { ok: false, reason: "invalid" });
  assert.deepEqual(assessOtp({ ...base, otp: "123456" }), { ok: true });
});

test("resend cooldown reports whole seconds remaining", () => {
  const now = Date.parse("2026-11-06T12:00:00.000Z");
  assert.equal(resendWaitSeconds(new Date(now + 59_100), now), 60);
  assert.equal(resendWaitSeconds(new Date(now - 1), now), 0);
});

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
