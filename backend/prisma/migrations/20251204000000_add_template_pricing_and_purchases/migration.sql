-- AlterTable
ALTER TABLE "AIPromptTemplate" ADD COLUMN "description" TEXT,
ADD COLUMN "thumbnail" TEXT,
ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "priceType" TEXT NOT NULL DEFAULT 'credits',
ADD COLUMN "category" TEXT,
ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "AIPromptTemplate_isPaid_idx" ON "AIPromptTemplate"("isPaid");

-- CreateIndex
CREATE INDEX "AIPromptTemplate_isActive_idx" ON "AIPromptTemplate"("isActive");

-- CreateTable
CREATE TABLE "TemplatePurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "paymentType" TEXT NOT NULL,
    "creditsUsed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplatePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplatePurchase_userId_templateId_key" ON "TemplatePurchase"("userId", "templateId");

-- CreateIndex
CREATE INDEX "TemplatePurchase_userId_idx" ON "TemplatePurchase"("userId");

-- CreateIndex
CREATE INDEX "TemplatePurchase_templateId_idx" ON "TemplatePurchase"("templateId");

-- CreateIndex
CREATE INDEX "TemplatePurchase_createdAt_idx" ON "TemplatePurchase"("createdAt");

-- AddForeignKey
ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "TemplatePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "TemplatePurchase_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AIPromptTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

