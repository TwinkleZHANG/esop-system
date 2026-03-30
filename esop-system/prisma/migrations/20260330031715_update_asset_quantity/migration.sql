/*
  Warnings:

  - You are about to drop the column `avgCost` on the `asset_positions` table. All the data in the column will be lost.
  - Added the required column `quantity` to the `asset_positions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "asset_positions" DROP COLUMN "avgCost",
ADD COLUMN     "quantity" DECIMAL(20,4) NOT NULL,
ALTER COLUMN "accountId" DROP DEFAULT;
