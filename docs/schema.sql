-- =============================================================================
-- Smart Waste Management System — PostgreSQL Database Schema (DDL)
-- Synchronized with Prisma Schema: backend/src/prisma/schema.prisma
-- =============================================================================

-- Enable UUID generation extension (PostgreSQL 13+ also includes gen_random_uuid() natively)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create ENUM Types
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "WasteType" AS ENUM ('organic', 'plastic', 'paper', 'unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReportStatus" AS ENUM ('pending', 'in_progress', 'completed', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Table: users
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "avatar_url" TEXT,
    "phone" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Unique Index on users.email
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- 3. Create Table: reports
CREATE TABLE IF NOT EXISTS "reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "latitude" DECIMAL(10, 8) NOT NULL,
    "longitude" DECIMAL(11, 8) NOT NULL,
    "address" TEXT,
    "waste_type" "WasteType" NOT NULL DEFAULT 'unknown',
    "ai_confidence" DOUBLE PRECISION,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reports_user_id_fkey"
        FOREIGN KEY ("user_id")
        REFERENCES "users"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Indexes on reports for filtering, sorting, and dashboard aggregations
CREATE INDEX IF NOT EXISTS "reports_user_id_idx" ON "reports"("user_id");
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "reports"("status");
CREATE INDEX IF NOT EXISTS "reports_waste_type_idx" ON "reports"("waste_type");
CREATE INDEX IF NOT EXISTS "reports_created_at_idx" ON "reports"("created_at");

-- 4. Create Table: report_logs
CREATE TABLE IF NOT EXISTS "report_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_id" UUID NOT NULL,
    "changed_by" UUID NOT NULL,
    "old_status" "ReportStatus" NOT NULL,
    "new_status" "ReportStatus" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "report_logs_report_id_fkey"
        FOREIGN KEY ("report_id")
        REFERENCES "reports"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT "report_logs_changed_by_fkey"
        FOREIGN KEY ("changed_by")
        REFERENCES "users"("id")
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Index on report_logs.report_id for fast audit timeline lookup
CREATE INDEX IF NOT EXISTS "report_logs_report_id_idx" ON "report_logs"("report_id");
