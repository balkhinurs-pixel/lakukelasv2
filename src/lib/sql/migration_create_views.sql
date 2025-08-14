-- This script creates the database views needed for the reports page.
-- Run this script once in your Supabase SQL Editor.

-- v_attendance_history: A view to simplify fetching attendance history with related data.
CREATE OR REPLACE VIEW public.v_attendance_history AS
SELECT 
  ah.id,
  ah.teacher_id,
  ah.class_id,
  ah.subject_id,
  ah.school_year_id,
  ah.date,
  date_part('month'::text, ah.date) AS month,
  ah.meeting_number,
  ah.records,
  c.name AS class_name,
  s.name AS subject_name,
  (SELECT jsonb_object_agg(st.id, st.name)
   FROM jsonb_populate_recordset(null::record, ah.records) AS r(student_id uuid, status text)
   JOIN students st ON st.id = r.student_id) AS student_names
FROM 
  attendance_history ah
JOIN 
  classes c ON ah.class_id = c.id
JOIN 
  subjects s ON ah.subject_id = s.id;

-- v_grade_history: A view to simplify fetching grade history with related data.
CREATE OR REPLACE VIEW public.v_grade_history AS
SELECT 
  gh.id,
  gh.teacher_id,
  gh.class_id,
  gh.subject_id,
  gh.school_year_id,
  gh.date,
  date_part('month'::text, gh.date) AS month,
  gh.assessment_type,
  gh.records,
  c.name AS class_name,
  s.name AS subject_name,
  s.kkm AS subject_kkm,
  (SELECT jsonb_object_agg(st.id, st.name)
   FROM jsonb_populate_recordset(null::record, gh.records) AS r(student_id uuid, score numeric)
   JOIN students st ON st.id = r.student_id) AS student_names
FROM 
  grade_history gh
JOIN 
  classes c ON gh.class_id = c.id
JOIN 
  subjects s ON gh.subject_id = s.id;
