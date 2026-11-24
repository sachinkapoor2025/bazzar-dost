-- DropIndex
DROP INDEX "ProductReview_userId_productSlug_key";

-- CreateIndex
CREATE INDEX "ProductReview_userId_productSlug_idx" ON "ProductReview"("userId", "productSlug");
