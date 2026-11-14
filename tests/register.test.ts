import assert from "node:assert/strict";
import test from "node:test";
import { registerSchema } from "../src/lib/validators";

test("registration accepts a name, email, and password with no verification code", () => {
  const parsed = registerSchema.parse({
    name: "Asha Rao",
    email: "Asha@Example.com",
    phone: "",
    password: "market12",
  });
  assert.equal(parsed.name, "Asha Rao");
  assert.equal(parsed.email, "Asha@Example.com");
  assert.equal(parsed.password, "market12");
  assert.equal("otp" in parsed, false);
});

test("registration rejects a short name, an invalid email, and a weak password", () => {
  assert.equal(registerSchema.safeParse({ name: "A", email: "asha@example.com", phone: "", password: "market12" }).success, false);
  assert.equal(registerSchema.safeParse({ name: "Asha Rao", email: "not-an-email", phone: "", password: "market12" }).success, false);
  assert.equal(registerSchema.safeParse({ name: "Asha Rao", email: "asha@example.com", phone: "", password: "password" }).success, false);
  assert.equal(registerSchema.safeParse({ name: "Asha Rao", email: "asha@example.com", phone: "", password: "market" }).success, false);
});
