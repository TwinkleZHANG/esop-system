-- AlterEnum
ALTER TYPE "GrantStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "grants" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
