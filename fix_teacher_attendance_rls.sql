-- Fix Teacher Attendance RLS Policies
-- This script fixes the missing INSERT policy for teacher_attendance table

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Guru dapat melihat absensi mereka sendiri." ON public.teacher_attendance;
DROP POLICY IF EXISTS "Admin dapat melihat semua absensi guru." ON public.teacher_attendance;
DROP POLICY IF EXISTS "Teachers can manage their own attendance" ON public.teacher_attendance;
DROP POLICY IF EXISTS "Admin can view all teacher attendance" ON public.teacher_attendance;

-- Create comprehensive policies that allow teachers to INSERT, UPDATE, and SELECT their own attendance
CREATE POLICY "Teachers can manage their own attendance" ON public.teacher_attendance 
    FOR ALL USING (auth.uid() = teacher_id);

-- Allow admins to view and manage all teacher attendance records  
CREATE POLICY "Admin can manage all teacher attendance" ON public.teacher_attendance 
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Verify the policies are applied correctly
\d+ public.teacher_attendance