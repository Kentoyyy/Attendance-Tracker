-- Create Grade table in Supabase
CREATE TABLE IF NOT EXISTS "Grade" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Grade_name_key" ON "Grade"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Grade_number_key" ON "Grade"("number");

-- Verify the table was created
SELECT * FROM "Grade";
