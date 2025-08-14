-- Drop the existing views if they exist to avoid column name/order conflicts
DROP VIEW IF EXISTS public.v_attendance_history;
DROP VIEW IF EXISTS public.v_grade_history;

-- Recreate the attendance history view with the correct column definitions and joins
CREATE OR REPLACE VIEW public.v_attendance_history AS
SELECT
  ah.id,
  ah.date,
  date_part('month', ah.date) as month,
  ah.class_id,
  c.name AS class_name,
  ah.subject_id,
  s.name AS subject_name,
  ah.teacher_id,
  ah.school_year_id,
  ah.meeting_number,
  ah.records,
  (
    SELECT json_object_agg(st.id, st.name)
    FROM jsonb_to_recordset(ah.records) AS r(student_id uuid, status text)
    JOIN students st ON st.id = r.student_id
  ) AS student_names
FROM
  attendance_history ah
  JOIN classes c ON ah.class_id = c.id
  JOIN subjects s ON ah.subject_id = s.id;

-- Recreate the grade history view with the correct column definitions and joins
CREATE OR REPLACE VIEW public.v_grade_history AS
SELECT
  gh.id,
  gh.date,
  date_part('month', gh.date) as month,
  gh.class_id,
  c.name AS class_name,
  gh.subject_id,
  s.name AS subject_name,
  s.kkm AS subject_kkm,
  gh.teacher_id,
  gh.school_year_id,
  gh.assessment_type,
  gh.records,
  (
    SELECT json_object_agg(st.id, st.name)
    FROM jsonb_to_recordset(gh.records) AS r(student_id uuid, score numeric)
    JOIN students st ON st.id = r.student_id
  ) AS student_names
FROM
  grade_history gh
  JOIN classes c ON gh.class_id = c.id
  JOIN subjects s ON gh.subject_id = s.id;