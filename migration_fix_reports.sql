-- 1. Hapus VIEW yang lama jika ada
DROP VIEW IF EXISTS public.v_attendance_history;
DROP VIEW IF EXISTS public.v_grade_history;

-- 2. Hapus fungsi yang lama jika ada, untuk memastikan kita mulai dari awal
DROP FUNCTION IF EXISTS public.get_report_data(uuid, uuid, integer);

-- 3. Buat fungsi database yang baru dan cerdas untuk mengambil data laporan
CREATE OR REPLACE FUNCTION public.get_report_data(
  p_teacher_id uuid,
  p_school_year_id uuid DEFAULT NULL,
  p_month integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    -- Variabel untuk menyimpan hasil
    v_summary_cards json;
    v_student_performance json;
    v_attendance_by_class json;
    v_overall_attendance_distribution json;
    v_journal_entries json;
    v_attendance_history json;
    v_grade_history json;
    v_all_students json;
    v_active_school_year_id uuid;

BEGIN
    -- Tentukan tahun ajaran aktif jika tidak disediakan
    IF p_school_year_id IS NULL THEN
        SELECT p.active_school_year_id INTO v_active_school_year_id FROM public.profiles p WHERE p.id = p_teacher_id;
    ELSE
        v_active_school_year_id := p_school_year_id;
    END IF;

    -- CTE untuk data yang sudah difilter
    WITH
    filtered_attendance AS (
      SELECT * FROM public.attendance_history
      WHERE teacher_id = p_teacher_id
        AND (v_active_school_year_id IS NULL OR school_year_id = v_active_school_year_id)
        AND (p_month IS NULL OR EXTRACT(MONTH FROM date) = p_month)
    ),
    filtered_grades AS (
      SELECT * FROM public.grade_history
      WHERE teacher_id = p_teacher_id
        AND (v_active_school_year_id IS NULL OR school_year_id = v_active_school_year_id)
        AND (p_month IS NULL OR EXTRACT(MONTH FROM date) = p_month)
    ),
    filtered_journals AS (
      SELECT * FROM public.journals
      WHERE teacher_id = p_teacher_id
        AND (v_active_school_year_id IS NULL OR school_year_id = v_active_school_year_id)
        AND (p_month IS NULL OR EXTRACT(MONTH FROM date) = p_month)
    ),
    teacher_students AS (
      SELECT s.id, s.name, s.class_id, c.name as class_name
      FROM public.students s
      JOIN public.classes c ON s.class_id = c.id
      WHERE c.teacher_id = p_teacher_id AND s.status = 'active'
    ),
    
    -- Kalkulasi untuk setiap bagian laporan
    calc_summary AS (
      SELECT
        COALESCE(
          (SELECT json_build_object(
            'overallAttendanceRate', ROUND(COALESCE((SUM(CASE WHEN (r->>'status') = 'Hadir' THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(*), 0)) * 100, 0), 2),
            'overallAverageGrade', ROUND(COALESCE(AVG((r->>'score')::numeric), 0), 2),
            'totalJournals', (SELECT COUNT(*) FROM filtered_journals)
          )
          FROM filtered_attendance, jsonb_to_recordset(records) as r(status text)),
          '{"overallAttendanceRate": 0, "overallAverageGrade": 0, "totalJournals": 0}'::json
        ) AS data
    ),
    calc_performance AS (
      SELECT COALESCE(json_agg(sp), '[]'::json) AS data FROM (
        SELECT
            s.id,
            s.name,
            s.class_name,
            ROUND(COALESCE(AVG((gr.r->>'score')::numeric), 0), 2) AS average_grade,
            ROUND(COALESCE((SUM(CASE WHEN ar.r->>'status' = 'Hadir' THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(ar.r), 0)) * 100, 100), 2) AS attendance,
            CASE
                WHEN COALESCE(AVG((gr.r->>'score')::numeric), 0) >= 85 AND COALESCE((SUM(CASE WHEN ar.r->>'status' = 'Hadir' THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(ar.r), 0)) * 100, 100) >= 90 THEN 'Sangat Baik'
                WHEN COALESCE(AVG((gr.r->>'score')::numeric), 0) >= 75 AND COALESCE((SUM(CASE WHEN ar.r->>'status' = 'Hadir' THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(ar.r), 0)) * 100, 100) >= 80 THEN 'Stabil'
                WHEN COALESCE(AVG((gr.r->>'score')::numeric), 0) < 75 OR COALESCE((SUM(CASE WHEN ar.r->>'status' = 'Hadir' THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(ar.r), 0)) * 100, 100) < 80 THEN 'Butuh Perhatian'
                ELSE 'Berisiko'
            END AS status
        FROM teacher_students s
        LEFT JOIN filtered_attendance fa ON (SELECT COUNT(*) FROM jsonb_to_recordset(fa.records) as r(student_id uuid) WHERE r.student_id = s.id) > 0
        LEFT JOIN jsonb_to_recordset(fa.records) AS ar(r) ON (ar.r->>'student_id')::uuid = s.id
        LEFT JOIN filtered_grades fg ON (SELECT COUNT(*) FROM jsonb_to_recordset(fg.records) as r(student_id uuid) WHERE r.student_id = s.id) > 0
        LEFT JOIN jsonb_to_recordset(fg.records) AS gr(r) ON (gr.r->>'student_id')::uuid = s.id
        GROUP BY s.id, s.name, s.class_name
        ORDER BY average_grade DESC
      ) sp
    ),
    calc_att_by_class AS (
      SELECT COALESCE(json_agg(abc), '[]'::json) AS data FROM (
        SELECT c.name,
          COALESCE(SUM(CASE WHEN r.status = 'Hadir' THEN 1 ELSE 0 END), 0) AS "Hadir",
          COALESCE(SUM(CASE WHEN r.status = 'Sakit' THEN 1 ELSE 0 END), 0) AS "Sakit",
          COALESCE(SUM(CASE WHEN r.status = 'Izin' THEN 1 ELSE 0 END), 0) AS "Izin",
          COALESCE(SUM(CASE WHEN r.status = 'Alpha' THEN 1 ELSE 0 END), 0) AS "Alpha"
        FROM filtered_attendance fa
        JOIN public.classes c ON fa.class_id = c.id,
        jsonb_to_recordset(fa.records) AS r(status text)
        GROUP BY c.name
      ) abc
    ),
    calc_overall_dist AS (
      SELECT COALESCE(json_object_agg(status, count), '{}'::json) AS data FROM (
        SELECT r->>'status' AS status, COUNT(*)
        FROM filtered_attendance, jsonb_array_elements(records) AS r
        GROUP BY r->>'status'
      ) t
    ),
    calc_journals AS (
      SELECT COALESCE(json_agg(j), '[]'::json) AS data FROM (
        SELECT j.id, j.date, j.class_id, j.subject_id, j.meeting_number, j.learning_objectives, c.name AS "className", s.name AS "subjectName"
        FROM filtered_journals j
        JOIN public.classes c ON j.class_id = c.id
        JOIN public.subjects s ON j.subject_id = s.id
        ORDER BY j.date DESC
      ) j
    ),
    calc_att_history AS (
      SELECT COALESCE(json_agg(ah), '[]'::json) AS data FROM (
        SELECT ah.id, ah.date, ah.class_id, ah.subject_id, ah.meeting_number, ah.records, c.name AS "className", s.name AS "subjectName"
        FROM filtered_attendance ah
        JOIN public.classes c ON ah.class_id = c.id
        JOIN public.subjects s ON ah.subject_id = s.id
        ORDER BY ah.date DESC
      ) ah
    ),
    calc_grade_history AS (
      SELECT COALESCE(json_agg(gh), '[]'::json) AS data FROM (
        SELECT gh.id, gh.date, gh.class_id, gh.subject_id, gh.assessment_type, gh.records, c.name AS "className", s.name AS "subjectName"
        FROM filtered_grades gh
        JOIN public.classes c ON gh.class_id = c.id
        JOIN public.subjects s ON gh.subject_id = s.id
        ORDER BY gh.date DESC
      ) gh
    ),
    calc_students AS (
      SELECT COALESCE(json_agg(s), '[]'::json) AS data FROM teacher_students s
    )
    SELECT json_build_object(
        'summary_cards', (SELECT data FROM calc_summary),
        'student_performance', (SELECT data FROM calc_performance),
        'attendance_by_class', (SELECT data FROM calc_att_by_class),
        'overall_attendance_distribution', (SELECT data FROM calc_overall_dist),
        'journal_entries', (SELECT data FROM calc_journals),
        'attendance_history', (SELECT data FROM calc_att_history),
        'grade_history', (SELECT data FROM calc_grade_history),
        'all_students', (SELECT data FROM calc_students)
    ) INTO v_summary_cards; -- reuse variable just to build the final json object

    -- Mengembalikan hasil dalam satu baris JSON
    RETURN v_summary_cards;
END;
$$;
