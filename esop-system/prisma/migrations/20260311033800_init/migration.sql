-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('RSU', 'OPTION', 'VIRTUAL_SHARE', 'LP_SHARE');

-- CreateEnum
CREATE TYPE "Jurisdiction" AS ENUM ('HK', 'CN', 'OVERSEAS');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "LegalIdentity" AS ENUM ('CN_RESIDENT', 'HK_RESIDENT', 'OVERSEAS_RESIDENT');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('DOMESTIC', 'OVERSEAS');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "GrantStatus" AS ENUM ('DRAFT', 'GRANTED', 'VESTING', 'VESTED', 'EXERCISED', 'SETTLED', 'CANCELLED', 'FORFEITED');

-- CreateEnum
CREATE TYPE "VestingStatus" AS ENUM ('PENDING', 'VESTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaxEventType" AS ENUM ('VESTING_TAX', 'EXERCISE_TAX');

-- CreateEnum
CREATE TYPE "TaxEventStatus" AS ENUM ('TRIGGERED', 'DATA_EXPORTED', 'DATA_IMPORTED', 'TAX_CONFIRMED', 'TAX_PAID');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('COMMON_SHARE', 'PREFERRED_SHARE', 'LP_SHARE', 'VIRTUAL_SHARE');

-- CreateEnum
CREATE TYPE "AssetTxType" AS ENUM ('ISSUANCE', 'SETTLEMENT', 'REPURCHASE', 'TRANSFER');

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "PlanType" NOT NULL,
    "applicableJurisdiction" "Jurisdiction" NOT NULL,
    "settlementMethod" TEXT[],
    "poolSize" DECIMAL(20,4) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "boardApprovalId" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "legalIdentity" "LegalIdentity" NOT NULL,
    "employmentEntity" TEXT[],
    "taxJurisdiction" "Jurisdiction" NOT NULL,
    "bankAccountType" "BankAccountType",
    "employmentStatus" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holding_entities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "jurisdiction" "Jurisdiction" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holding_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valuations" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fmv" DECIMAL(20,4) NOT NULL,
    "source" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grants" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "strikePrice" DECIMAL(20,4),
    "grantDate" TIMESTAMP(3) NOT NULL,
    "vestingStartDate" TIMESTAMP(3) NOT NULL,
    "vestingEndDate" TIMESTAMP(3),
    "status" "GrantStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "PlanType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vesting_events" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "vestDate" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "cumulativeQty" DECIMAL(20,4) NOT NULL,
    "status" "VestingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vesting_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_events" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "eventType" "TaxEventType" NOT NULL,
    "triggerDate" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "taxableAmount" DECIMAL(20,4),
    "taxAmount" DECIMAL(20,4),
    "status" "TaxEventStatus" NOT NULL DEFAULT 'TRIGGERED',
    "exportFileUrl" TEXT,
    "importFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_positions" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "holdingEntityId" TEXT,
    "assetType" "AssetType" NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "costBasis" DECIMAL(20,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_transactions" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "txType" "AssetTxType" NOT NULL,
    "quantity" DECIMAL(20,4) NOT NULL,
    "price" DECIMAL(20,4),
    "relatedGrantId" TEXT,
    "relatedTaxEventId" TEXT,
    "txDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "operatorId" TEXT,
    "operatorRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeId_key" ON "employees"("employeeId");

-- AddForeignKey
ALTER TABLE "grants" ADD CONSTRAINT "grants_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grants" ADD CONSTRAINT "grants_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vesting_events" ADD CONSTRAINT "vesting_events_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "grants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_events" ADD CONSTRAINT "tax_events_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "grants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
