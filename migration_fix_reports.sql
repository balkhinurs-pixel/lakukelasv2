-- 1. Hapus VIEW yang lama (jika ada) untuk memastikan migrasi bersih.
DROP VIEW IF EXISTS public.v_attendance_history;
DROP VIEW IF EXISTS public.v_grade_history;

-- 2. Buat atau Ganti fungsi database yang baru dan cerdas untuk mengambil data laporan.
-- Fungsi ini dirancang agar selalu mengembalikan struktur data yang valid, bahkan jika tidak ada data sama sekali.
CREATE OR REPLACE FUNCTION get_report_data (
  p_teacher_id uuid,
  p_school_year_id uuid DEFAULT NULL,
  p_month INT DEFAULT NULL
) RETURNS TABLE (
  summary_cards jsonb,
  student_performance jsonb,
  attendance_by_class jsonb,
  overall_attendance_distribution jsonb,
  journal_entries jsonb,
  attendance_history jsonb,
  grade_history jsonb,
  all_students jsonb
) AS $$
DECLARE
  v_summary_cards jsonb;
  v_student_performance jsonb;
  v_attendance_by_class jsonb;
  v_overall_attendance_distribution jsonb;
  v_journal_entries jsonb;
  v_attendance_history jsonb;
  v_grade_history jsonb;
  v_all_students jsonb;
BEGIN
  -- Base CTEs for filtered data
  WITH
  filtered_attendance AS (
    SELECT * FROM attendance_history
    WHERE teacher_id = p_teacher_id
    AND (p_school_year_id IS NULL OR school_year_id = p_school_year_id)
    AND (p_month IS NULL OR EXTRACT(MONTH FROM date) = p_month)
  ),
  filtered_grades AS (
    SELECT * FROM grade_history
    WHERE teacher_id = p_teacher_id
    AND (p_school_year_id IS NULL OR school_year_id = p_school_year_id)
    AND (p_month IS NULL OR EXTRACT(MONTH FROM date) = p_month)
  ),
  filtered_journals AS (
     SELECT * FROM journals
    WHERE teacher_id = p_teacher_id
    AND (p_school_year_id IS NULL OR school_year_id = p_school_year_id)
    AND (p_month IS NULL OR EXTRACT(MONTH FROM date) = p_month)
  ),
  teacher_students AS (
    SELECT s.id, s.name, s.nis, s.class_id, c.name AS class_name
    FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE c.teacher_id = p_teacher_id AND s.status = 'active'
  )
  -- 1. Summary Cards
  SELECT to_jsonb(t) INTO v_summary_cards FROM (
    SELECT
      COALESCE((SELECT (sum(CASE WHEN (r->>'status') = 'Hadir' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(count(*), 0)) * 100 FROM filtered_attendance, jsonb_to_recordset(records) AS r(student_id UUID, status TEXT)), 0) AS "overallAttendanceRate",
      COALESCE((SELECT avg((r->>'score')::NUMERIC) FROM filtered_grades, jsonb_to_recordset(records) AS r(student_id UUID, score TEXT)), 0) AS "overallAverageGrade",
      COALESCE((SELECT count(*) FROM filtered_journals), 0) AS "totalJournals"
  ) t;

  -- 2. Student Performance
  SELECT COALESCE(jsonb_agg(sp), '[]'::jsonb) INTO v_student_performance FROM (
      SELECT
          s.id,
          s.name,
          s.class_name,
          COALESCE(avg((gr.r->>'score')::NUMERIC), 0) AS average_grade,
          COALESCE((sum(CASE WHEN ar.r->>'status' = 'Hadir' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(count(ar.r), 0)) * 100, 100) AS attendance_percentage,
          CASE
              WHEN COALESCE(avg((gr.r->>'score')::NUMERIC), 0) >= 85 AND COALESCE((sum(CASE WHEN ar.r->>'status' = 'Hadir' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(count(ar.r), 0)) * 100, 100) >= 90 THEN 'Sangat Baik'
              WHEN COALESCE(avg((gr.r->>'score')::NUMERIC), 0) >= 75 AND COALESCE((sum(CASE WHEN ar.r->>'status' = 'Hadir' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(count(ar.r), 0)) * 100, 100) >= 80 THEN 'Stabil'
              WHEN COALESCE(avg((gr.r->>'score')::NUMERIC), 0) < 75 OR COALESCE((sum(CASE WHEN ar.r->>'status' = 'Hadir' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(count(ar.r), 0)) * 100, 100) < 80 THEN 'Butuh Perhatian'
              ELSE 'Berisiko'
          END AS status
      FROM teacher_students s
      LEFT JOIN filtered_attendance fa ON TRUE
      LEFT JOIN LATERAL jsonb_to_recordset(fa.records) AS ar(r) ON (ar.r->>'student_id')::UUID = s.id
      LEFT JOIN filtered_grades fg ON TRUE
      LEFT JOIN LATERAL jsonb_to_recordset(fg.records) AS gr(r) ON (gr.r->>'student_id')::UUID = s.id
      GROUP BY s.id, s.name, s.class_name
      ORDER BY average_grade DESC
  ) sp;

  -- 3. Attendance by Class
  SELECT COALESCE(jsonb_agg(abc), '[]'::jsonb) INTO v_attendance_by_class FROM (
      SELECT
          c.name AS class_name,
          json_agg(json_build_object('status', r.status, 'count', count(r.status))) AS distribution
      FROM filtered_attendance fa
      JOIN classes c ON fa.class_id = c.id,
      LATERAL jsonb_to_recordset(fa.records) AS r(status TEXT)
      GROUP BY c.name
  ) abc;

  -- 4. Overall Attendance Distribution
  SELECT COALESCE(jsonb_object_agg(status, count), '{}'::jsonb) INTO v_overall_attendance_distribution
    FROM (
        SELECT r->>'status' AS status, count(*)
        FROM filtered_attendance, jsonb_array_elements(records) AS r
        GROUP BY r->>'status'
    ) t;

  -- 5. Journal Entries
  SELECT COALESCE(jsonb_agg(j), '[]'::jsonb) INTO v_journal_entries FROM (
      SELECT j.id, j.date, j.class_id, j.subject_id, j.meeting_number, j.learning_objectives, j.learning_activities, j.assessment, j.reflection, c.name AS "className", s.name AS "subjectName"
      FROM filtered_journals j
      JOIN classes c ON j.class_id = c.id
      JOIN subjects s ON j.subject_id = s.id
      ORDER BY j.date DESC
  ) j;

  -- 6. Attendance History
  SELECT COALESCE(jsonb_agg(ah), '[]'::jsonb) INTO v_attendance_history FROM (
    SELECT ah.id, ah.date, ah.class_id, ah.subject_id, ah.meeting_number, ah.records, c.name AS "className", s.name AS "subjectName"
    FROM filtered_attendance ah
    JOIN classes c ON ah.class_id = c.id
    JOIN subjects s ON ah.subject_id = s.id
    ORDER BY ah.date DESC
  ) ah;

  -- 7. Grade History
  SELECT COALESCE(jsonb_agg(gh), '[]'::jsonb) INTO v_grade_history FROM (
    SELECT gh.id, gh.date, gh.class_id, gh.subject_id, gh.assessment_type, gh.records, c.name AS "className", s.name AS "subjectName"
    FROM filtered_grades gh
    JOIN classes c ON gh.class_id = c.id
    JOIN subjects s ON gh.subject_id = s.id
    ORDER BY gh.date DESC
  ) gh;

  -- 8. All students
  SELECT COALESCE(jsonb_agg(s), '[]'::jsonb) INTO v_all_students FROM teacher_students s;

  -- Return all results
  RETURN QUERY SELECT
    v_summary_cards,
    v_student_performance,
    v_attendance_by_class,
    v_overall_attendance_distribution,
    v_journal_entries,
    v_attendance_history,
    v_grade_history,
    v_all_students;

END;
$$ LANGUAGE plpgsql VOLATILE;
