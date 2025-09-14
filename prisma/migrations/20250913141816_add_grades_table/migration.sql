-- DropForeignKey
ALTER TABLE "public"."AbsenceNote" DROP CONSTRAINT "AbsenceNote_approvedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AbsenceNote" DROP CONSTRAINT "AbsenceNote_attendanceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Attendance" DROP CONSTRAINT "Attendance_recordedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Attendance" DROP CONSTRAINT "Attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Log" DROP CONSTRAINT "Log_userId_fkey";

-- AlterTable
ALTER TABLE "public"."AbsenceNote" ALTER COLUMN "studentName" SET DEFAULT '';

-- AlterTable
ALTER TABLE "public"."Attendance" ALTER COLUMN "studentName" SET DEFAULT '';

-- AlterTable
ALTER TABLE "public"."Student" ADD COLUMN     "gradeId" TEXT;

-- CreateTable
CREATE TABLE "public"."Grade" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Grade_name_key" ON "public"."Grade"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_number_key" ON "public"."Grade"("number");
