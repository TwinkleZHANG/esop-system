-- Convert existing TaxEventStatus values to new enum
-- TRIGGERED/DATA_EXPORTED -> PENDING
-- DATA_IMPORTED/TAX_CONFIRMED -> PAID
-- TAX_PAID -> CONFIRMED

-- Step 1: Create new enum type
CREATE TYPE "TaxEventStatus_new" AS ENUM ('PENDING', 'PAID', 'CONFIRMED');

-- Step 2: Remove default so we can alter the column
ALTER TABLE "tax_events" ALTER COLUMN "status" DROP DEFAULT;

-- Step 3: Convert data and switch to new enum
ALTER TABLE "tax_events"
  ALTER COLUMN "status" TYPE "TaxEventStatus_new"
  USING (
    CASE "status"::text
      WHEN 'TRIGGERED' THEN 'PENDING'
      WHEN 'DATA_EXPORTED' THEN 'PENDING'
      WHEN 'DATA_IMPORTED' THEN 'PAID'
      WHEN 'TAX_CONFIRMED' THEN 'PAID'
      WHEN 'TAX_PAID' THEN 'CONFIRMED'
    END
  )::"TaxEventStatus_new";

-- Step 4: Swap enum types
ALTER TYPE "TaxEventStatus" RENAME TO "TaxEventStatus_old";
ALTER TYPE "TaxEventStatus_new" RENAME TO "TaxEventStatus";
DROP TYPE "TaxEventStatus_old";

-- Step 5: Set new default
ALTER TABLE "tax_events" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Step 6: Drop old file URL columns, add new receiptFileUrl
ALTER TABLE "tax_events" DROP COLUMN IF EXISTS "exportFileUrl";
ALTER TABLE "tax_events" DROP COLUMN IF EXISTS "importFileUrl";
ALTER TABLE "tax_events" ADD COLUMN "receiptFileUrl" TEXT;
