-- This script creates database views to optimize data fetching for reports.
-- Run this script ONCE in your Supabase SQL Editor.

-- Drop existing views if they exist to ensure a clean slate
DROP VIEW IF EXISTS public.v_attendance_history;
DROP VIEW IF EXISTS public.v_grade_history;

-- View for enriched attendance history
CREATE OR REPLACE VIEW public.v_attendance_history AS
SELECT
  ah.id,
  ah.date,
  ah.class_id,
  ah.subject_id,
  ah.school_year_id,
  ah.meeting_number,
  ah.records,
  ah.teacher_id,
  ah.created_at,
  EXTRACT(MONTH FROM ah.date) AS month,
  c.name AS class_name,
  s.name AS subject_name,
  (
    SELECT jsonb_object_agg(st.id, st.name)
    FROM jsonb_to_recordset(ah.records) AS r(student_id uuid, status text)
    JOIN students st ON st.id = r.student_id
  ) AS student_names
FROM
  attendance_history ah
  JOIN classes c ON ah.class_id = c.id
  JOIN subjects s ON ah.subject_id = s.id;


-- View for enriched grade history
CREATE OR REPLACE VIEW public.v_grade_history AS
SELECT
  gh.id,
  gh.date,
  gh.class_id,
  gh.subject_id,
  gh.school_year_id,
  gh.assessment_type,
  gh.records,
  gh.teacher_id,
  gh.created_at,
  EXTRACT(MONTH FROM gh.date) AS month,
  c.name AS class_name,
  s.name AS subject_name,
  (
    SELECT jsonb_object_agg(st.id, st.name)
    FROM jsonb_to_recordset(gh.records) AS r(student_id uuid, score numeric)
    JOIN students st ON st.id = r.student_id
  ) AS student_names
FROM
  grade_history gh
  JOIN classes c ON gh.class_id = c.id
  JOIN subjects s ON gh.subject_id = s.id;
