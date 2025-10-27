-- Migration to add leave feature to teacher attendance
-- This script should be run once on your existing Supabase database.

-- First, add the new values to the enum type for status.
-- We run them separately to avoid errors if one already exists.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Sakit' AND enumtypid = 'teacher_attendance_status'::regtype) THEN
        ALTER TYPE teacher_attendance_status ADD VALUE 'Sakit';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Izin' AND enumtypid = 'teacher_attendance_status'::regtype) THEN
        ALTER TYPE teacher_attendance_status ADD VALUE 'Izin';
    END IF;
END
$$;

-- Second, add the 'reason' column to the teacher_attendance table if it doesn't already exist.
-- This column will store the reason for being sick or on leave.
ALTER TABLE public.teacher_attendance
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Confirmation comment
-- The 'teacher_attendance' table is now updated to support 'Sakit' and 'Izin' statuses with a reason.
