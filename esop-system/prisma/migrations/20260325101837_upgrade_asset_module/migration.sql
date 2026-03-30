-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'FROZEN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationType" AS ENUM ('EXERCISE', 'TRANSFER', 'DIVIDEND', 'REDEEM');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- Create new AssetTxType enum
CREATE TYPE "AssetTxType_new" AS ENUM ('SETTLEMENT', 'REPURCHASE', 'DIVIDEND', 'REDEEM', 'CANCEL');

-- AlterEnum - Add ON_LEAVE to EmployeeStatus
ALTER TYPE "EmployeeStatus" ADD VALUE 'ON_LEAVE';

-- AlterTable - asset_positions: drop old columns first, then add new ones
ALTER TABLE "asset_positions" DROP COLUMN IF EXISTS "costBasis",
DROP COLUMN IF EXISTS "quantity",
ADD COLUMN "accountId" TEXT NOT NULL DEFAULT '',
ADD COLUMN "avgCost" DECIMAL(20,4),
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'CNY',
ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable - asset_transactions: add new columns first (nullable temporarily)
ALTER TABLE "asset_transactions"
ADD COLUMN "changeType" "AssetTxType_new",
ADD COLUMN "balanceAfter" DECIMAL(20,4),
ADD COLUMN "costBasis" DECIMAL(20,4),
ADD COLUMN "tradeDate" TIMESTAMP(3),
ADD COLUMN "trxId" TEXT;

-- Migrate data: copy txType to changeType (convert old enum to new enum)
UPDATE "asset_transactions" SET "changeType" =
  CASE
    WHEN "txType"::text = 'ISSUANCE' THEN 'SETTLEMENT'::"AssetTxType_new"
    WHEN "txType"::text = 'SETTLEMENT' THEN 'SETTLEMENT'::"AssetTxType_new"
    WHEN "txType"::text = 'REPURCHASE' THEN 'REPURCHASE'::"AssetTxType_new"
    WHEN "txType"::text = 'TRANSFER' THEN 'SETTLEMENT'::"AssetTxType_new"
    ELSE 'SETTLEMENT'::"AssetTxType_new"
  END;

-- Migrate other columns
UPDATE "asset_transactions" SET "balanceAfter" = 0 WHERE "balanceAfter" IS NULL;
UPDATE "asset_transactions" SET "tradeDate" = "txDate" WHERE "tradeDate" IS NULL;
UPDATE "asset_transactions" SET "trxId" = 'TRX-' || to_char(now(), 'YYYYMMDD') || '-' || id WHERE "trxId" IS NULL;

-- Now make columns NOT NULL
ALTER TABLE "asset_transactions"
ALTER COLUMN "changeType" SET NOT NULL,
ALTER COLUMN "balanceAfter" SET NOT NULL,
ALTER COLUMN "tradeDate" SET NOT NULL,
ALTER COLUMN "trxId" SET NOT NULL;

-- Drop old columns
ALTER TABLE "asset_transactions" DROP COLUMN IF EXISTS "price",
DROP COLUMN IF EXISTS "txDate",
DROP COLUMN IF EXISTS "txType";

-- Replace old enum with new one
DROP TYPE "AssetTxType";
ALTER TYPE "AssetTxType_new" RENAME TO "AssetTxType";

-- AlterTable - grants: add processedQty
ALTER TABLE "grants" ADD COLUMN IF NOT EXISTS "processedQty" DECIMAL(20,4) NOT NULL DEFAULT 0;

-- CreateTable - applications
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "ApplicationType" NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "price" DECIMAL(20,4),
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "reviewerId" TEXT,
    "reviewRemark" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_positions_accountId_key" ON "asset_positions"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_transactions_trxId_key" ON "asset_transactions"("trxId");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "grants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_positions" ADD CONSTRAINT "asset_positions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_positions" ADD CONSTRAINT "asset_positions_holdingEntityId_fkey" FOREIGN KEY ("holdingEntityId") REFERENCES "holding_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_transactions" ADD CONSTRAINT "asset_transactions_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "asset_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
