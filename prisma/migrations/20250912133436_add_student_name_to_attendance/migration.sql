/*
  Warnings:

  - Added the required column `studentName` to the `AbsenceNote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentName` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AbsenceNote" ADD COLUMN     "studentName" TEXT;
UPDATE "public"."AbsenceNote" an
SET "studentName" = coalesce(s."firstName", '') || CASE WHEN s."lastName" IS NULL OR s."lastName" = '' THEN '' ELSE ' ' || s."lastName" END
FROM "public"."Attendance" a
JOIN "public"."Student" s ON s.id = a."studentId"
WHERE an."attendanceId" = a.id AND an."studentName" IS NULL;
ALTER TABLE "public"."AbsenceNote" ALTER COLUMN "studentName" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Attendance" ADD COLUMN     "studentName" TEXT;
UPDATE "public"."Attendance" a
SET "studentName" = coalesce(s."firstName", '') || CASE WHEN s."lastName" IS NULL OR s."lastName" = '' THEN '' ELSE ' ' || s."lastName" END
FROM "public"."Student" s
WHERE s.id = a."studentId" AND a."studentName" IS NULL;
ALTER TABLE "public"."Attendance" ALTER COLUMN "studentName" SET NOT NULL;
