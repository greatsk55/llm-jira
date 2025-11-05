-- AlterTable
ALTER TABLE "Issue" ADD COLUMN "domain" TEXT;

-- CreateIndex
CREATE INDEX "Issue_domain_idx" ON "Issue"("domain");
