-- AlterTable
ALTER TABLE "grants" ADD COLUMN     "cliffPeriod" INTEGER DEFAULT 0,
ADD COLUMN     "vestingFrequency" TEXT,
ADD COLUMN     "vestingYear" INTEGER;
