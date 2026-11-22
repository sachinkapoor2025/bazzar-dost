-- CreateTable
CREATE TABLE "AdminRecord" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "payload" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminRecord_kind_createdAt_idx" ON "AdminRecord"("kind", "createdAt");
