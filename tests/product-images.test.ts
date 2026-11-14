import assert from "node:assert/strict";
import test from "node:test";
import shopifyCatalogue from "../src/data/shopify-catalogue.json";
import { displayImages, duplicateListingIds, isLoadableProductImage } from "../src/lib/product-images";

const brokenSponge = "https://cdn.shopify.com/s/files/1/0941/8653/7207/files/Cellulose-Cleaning-Sponge-3-pc-1779184682_568d4f19-9760-44ee-b528-05818382cedb.jpg?v=1786645195";
const workingSponge = "https://cdn.shopify.com/s/files/1/0941/8653/7207/files/Cellulose-Cleaning-Sponge-3-pc-1779184682_55b61b01-bc19-46c2-ad8b-1a90061c53c6.jpg?v=1781342239";

test("rejects missing, generated, and confirmed-missing image URLs", () => {
  assert.equal(isLoadableProductImage(""), false);
  assert.equal(isLoadableProductImage("/media/products/kraft-envelope-pack.svg"), false);
  assert.equal(isLoadableProductImage("/media/categories/home-kitchen.svg"), false);
  assert.equal(isLoadableProductImage(brokenSponge), false);
  assert.equal(isLoadableProductImage(workingSponge), true);
});

test("keeps a product's own later photo when the first file is missing", () => {
  const product = shopifyCatalogue.products.find((item) => item.slug === "cellulose-cleaning-sponge-3-pcs");
  assert.ok(product);
  const images = displayImages(product.images);
  assert.ok(images.length > 0);
  assert.equal(images.some((image) => image.url === brokenSponge), false);
  assert.equal(images[0]?.url, workingSponge);
});

test("hides catalogue rows with no loadable image and extra HE- copies of the same product", () => {
  const visible = shopifyCatalogue.products.flatMap((product) => {
    const images = displayImages(product.images);
    if (images.length === 0) return [];
    return [{ id: product.slug, sku: product.sku, name: product.name, price: product.price, images }];
  });
  const hidden = duplicateListingIds(visible);
  const shown = visible.filter((product) => !hidden.has(product.id));

  assert.equal(shown.some((product) => product.id === "24-grid-acrylic-lipstic-organiser"), false);
  assert.equal(shown.some((product) => product.id === "24-pcs-color-markers-pen"), false);
  assert.equal(shown.some((product) => product.id === "bolt-sticker"), false);
  assert.equal(shown.some((product) => product.id === "bolt-sticker-screw-hook"), true);
  assert.equal(shown.some((product) => product.id === "hair-curling-nova-iron"), true);
  assert.equal(shown.some((product) => product.id === "neck-and-shoulder-massager"), true);
  assert.equal(shown.some((product) => product.id === "neck-and-shoulder-massager-1"), true);
  assert.ok(shown.every((product) => product.images.every((image) => isLoadableProductImage(image.url))));
  assert.ok(shown.length > 700);
});
