import assert from "node:assert/strict";
import test from "node:test";
import { absoluteUrl, canonicalRedirectTarget, PRODUCTION_SITE_URL, resolveSiteUrl, site } from "../src/lib/site";

test("production always uses the custom domain", () => {
  assert.equal(resolveSiteUrl("http://localhost:3000", "production"), PRODUCTION_SITE_URL);
  assert.equal(resolveSiteUrl("https://main.d160fo98boktnf.amplifyapp.com", "production"), PRODUCTION_SITE_URL);
  assert.equal(resolveSiteUrl("https://www.bazaardost.com", "production"), PRODUCTION_SITE_URL);
  assert.equal(resolveSiteUrl(undefined, "production"), PRODUCTION_SITE_URL);
});

test("local development keeps the configured localhost URL", () => {
  assert.equal(resolveSiteUrl("http://localhost:3000", "development"), "http://localhost:3000");
  assert.equal(resolveSiteUrl(undefined, "development"), "http://localhost:3000");
  assert.equal(resolveSiteUrl("http://localhost:3000/", "test"), "http://localhost:3000");
});

test("alias hosts redirect to the apex custom domain", () => {
  assert.equal(
    canonicalRedirectTarget(["main.d160fo98boktnf.amplifyapp.com"], "/shop", "?q=mug", "production"),
    "https://bazaardost.com/shop?q=mug",
  );
  assert.equal(
    canonicalRedirectTarget(["www.bazaardost.com"], "/login", "", "production"),
    "https://bazaardost.com/login",
  );
  assert.equal(canonicalRedirectTarget(["bazaardost.com"], "/shop", "", "production"), null);
  assert.equal(canonicalRedirectTarget(["www.bazaardost.com"], "/shop", "", "development"), null);
  assert.equal(canonicalRedirectTarget(["localhost:3000"], "/", "", "production"), null);
});

test("absolute links follow the active site URL", () => {
  assert.equal(absoluteUrl("/sitemap.xml").startsWith(site.url.replace(/\/$/, "")), true);
  assert.equal(absoluteUrl("https://cdn.shopify.com/a.jpg"), "https://cdn.shopify.com/a.jpg");
});
