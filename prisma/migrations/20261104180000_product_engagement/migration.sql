-- CreateTable
CREATE TABLE "ProductEngagement" (
    "slug" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductEngagement_pkey" PRIMARY KEY ("slug")
);
