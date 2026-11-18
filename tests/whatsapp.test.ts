import assert from "node:assert/strict";
import test from "node:test";
import { WHATSAPP_MESSAGE, whatsAppHref, whatsAppNumber, whatsAppReady } from "../src/lib/whatsapp";

test("the shop WhatsApp link is used when no number is configured", () => {
  assert.equal(whatsAppNumber(""), "919911083275");
  assert.equal(whatsAppReady(""), true);
  assert.equal(whatsAppHref(""), "https://wa.me/919911083275?text=Hello%2C%20I%20need%20assistance.");
  assert.equal(WHATSAPP_MESSAGE, "Hello, I need assistance.");
});

test("a configured WhatsApp number replaces the shop default", () => {
  assert.equal(whatsAppNumber("91 90000 00000"), "919000000000");
  assert.equal(whatsAppHref("9000000000").startsWith("https://wa.me/9000000000?text="), true);
});
