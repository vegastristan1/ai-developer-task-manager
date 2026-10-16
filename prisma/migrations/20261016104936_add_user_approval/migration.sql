-- AlterTable
ALTER TABLE "User" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Grandfather existing accounts (including the demo account) so nobody is
-- locked out by the new default. Accounts created after this migration start
-- unapproved until an admin approves them.
UPDATE "User" SET "approved" = true, "approvedAt" = NOW() WHERE "approved" = false;
