-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "pin" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
