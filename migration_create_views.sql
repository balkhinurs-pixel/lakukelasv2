
-- This script creates database views to simplify reporting queries.
-- Views act like virtual tables, pre-joining data for faster and easier access.
-- Run this script once in your Supabase SQL Editor.

-- Attendance History View
-- This view joins attendance history with class and subject names.
CREATE OR REPLACE VIEW public.v_attendance_history AS
SELECT
  ah.id,
  ah.teacher_id,
  ah.date,
  ah.class_id,
  ah.subject_id,
  ah.school_year_id,
  ah.meeting_number,
  ah.records,
  c.name as class_name,
  s.name as subject_name,
  (SELECT json_object_agg(st.id, st.name) FROM jsonb_to_recordset(ah.records) AS r(student_id uuid, status text) JOIN students st ON st.id = r.student_id) as student_names,
  EXTRACT(MONTH FROM ah.date) as month
FROM
  attendance_history ah
JOIN
  classes c ON ah.class_id = c.id
JOIN
  subjects s ON ah.subject_id = s.id;


-- Grade History View
-- This view joins grade history with class, subject names, and KKM.
CREATE OR REPLACE VIEW public.v_grade_history AS
SELECT
  gh.id,
  gh.teacher_id,
  gh.date,
  gh.class_id,
  gh.subject_id,
  gh.school_year_id,
  gh.assessment_type,
  gh.records,
  c.name as class_name,
  s.name as subject_name,
  s.kkm as subject_kkm,
  (SELECT json_object_agg(st.id, st.name) FROM jsonb_to_recordset(gh.records) AS r(student_id uuid, score numeric) JOIN students st ON st.id = r.student_id) as student_names,
  EXTRACT(MONTH FROM gh.date) as month
FROM
  grade_history gh
JOIN
  classes c ON gh.class_id = c.id
JOIN
  subjects s ON gh.subject_id = s.id;
