-- Step 1: Drop the old, problematic views if they exist.
DROP VIEW IF EXISTS v_attendance_history;
DROP VIEW IF EXISTS v_grade_history;

-- Step 2: Drop the old RPC function if it exists to ensure a clean slate.
DROP FUNCTION IF EXISTS get_report_data(uuid, uuid, integer);

-- Step 3: Create the new, correct RPC function to fetch all report data.
CREATE OR REPLACE FUNCTION get_report_data(p_teacher_id uuid, p_school_year_id uuid, p_month integer)
RETURNS TABLE (
    attendance_history json[],
    grade_history json[],
    journal_entries json[],
    all_students json[],
    attendance_by_class json[],
    student_performance json[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- Filter data based on the provided parameters.
    -- If a month is provided, we ignore the school year filter for flexibility.
    filtered_attendance AS (
        SELECT * FROM public.attendance_history ah
        WHERE ah.teacher_id = p_teacher_id
          AND (p_month IS NULL OR EXTRACT(MONTH FROM ah.date) = p_month)
          AND (p_month IS NOT NULL OR ah.school_year_id = p_school_year_id)
    ),
    filtered_grades AS (
        SELECT * FROM public.grade_history gh
        WHERE gh.teacher_id = p_teacher_id
          AND (p_month IS NULL OR EXTRACT(MONTH FROM gh.date) = p_month)
          AND (p_month IS NOT NULL OR gh.school_year_id = p_school_year_id)
    ),
    filtered_journals AS (
        SELECT * FROM public.journals j
        WHERE j.teacher_id = p_teacher_id
          AND (p_month IS NULL OR EXTRACT(MONTH FROM j.date) = p_month)
          AND (p_month IS NOT NULL OR j.school_year_id = p_school_year_id)
    ),
    -- Get a list of all unique students who have records in the filtered data.
    distinct_students AS (
      SELECT DISTINCT s.id, s.name, s.nis, c.id as class_id, c.name as class_name 
      FROM public.students s
      JOIN public.classes c ON s.class_id = c.id
      WHERE c.teacher_id = p_teacher_id 
        AND (
          s.id IN (SELECT (jsonb_array_elements(records)->>'student_id')::uuid FROM filtered_attendance)
          OR s.id IN (SELECT (jsonb_array_elements(records)->>'student_id')::uuid FROM filtered_grades)
        )
    ),
    -- Calculate performance stats for each student.
    student_stats AS (
      SELECT
        s.id as student_id,
        s.name,
        s.class_name,
        -- Calculate average grade
        COALESCE(AVG((rec.score)::numeric), 0) as average_grade,
        -- Calculate attendance percentage
        COALESCE(
          (SUM(CASE WHEN rec_att.status = 'Hadir' THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(rec_att.status), 0),
          100
        ) as attendance_percentage
      FROM distinct_students s
      LEFT JOIN filtered_grades fg ON fg.class_id = s.class_id
      CROSS JOIN LATERAL jsonb_to_recordset(fg.records) as rec(student_id uuid, score text)
      WHERE rec.student_id = s.id
      LEFT JOIN filtered_attendance fa ON fa.class_id = s.class_id
      CROSS JOIN LATERAL jsonb_to_recordset(fa.records) as rec_att(student_id uuid, status text)
      WHERE rec_att.student_id = s.id
      GROUP BY s.id, s.name, s.class_name
    )
    SELECT
        -- Aggregate Attendance History
        (SELECT COALESCE(array_to_json(array_agg(row_to_json(t))), '[]') FROM (
            SELECT ah.id, ah.date, ah.meeting_number, ah.records, ah.class_id, ah.subject_id,
                   c.name AS class_name, sub.name AS subject_name
            FROM filtered_attendance ah
            JOIN public.classes c ON ah.class_id = c.id
            JOIN public.subjects sub ON ah.subject_id = sub.id
        ) t) AS attendance_history,

        -- Aggregate Grade History
        (SELECT COALESCE(array_to_json(array_agg(row_to_json(t))), '[]') FROM (
            SELECT gh.id, gh.date, gh.assessment_type, gh.records, gh.class_id, gh.subject_id,
                   c.name AS class_name, sub.name AS subject_name
            FROM filtered_grades gh
            JOIN public.classes c ON gh.class_id = c.id
            JOIN public.subjects sub ON gh.subject_id = sub.id
        ) t) AS grade_history,

        -- Aggregate Journal Entries
        (SELECT COALESCE(array_to_json(array_agg(row_to_json(t))), '[]') FROM (
             SELECT j.id, j.date, j.meeting_number, j.learning_objectives, j.class_id, j.subject_id,
                   c.name AS class_name, sub.name AS subject_name
            FROM filtered_journals j
            JOIN public.classes c ON j.class_id = c.id
            JOIN public.subjects sub ON j.subject_id = sub.id
        ) t) AS journal_entries,
        
        -- Aggregate All Students involved in the report
        (SELECT COALESCE(array_to_json(array_agg(row_to_json(t))), '[]') FROM (
            SELECT * FROM distinct_students
        ) t) AS all_students,

        -- Aggregate Attendance Distribution by Class
        (SELECT COALESCE(array_to_json(array_agg(row_to_json(t))), '[]') FROM (
            SELECT
                c.id AS class_id,
                c.name AS class_name,
                json_agg(json_build_object('status', r.status, 'count', r.count)) AS distribution
            FROM
                public.classes c
            LEFT JOIN (
                SELECT
                    ah.class_id,
                    (jsonb_array_elements(ah.records)->>'status') AS status,
                    COUNT(*) AS count
                FROM
                    filtered_attendance ah
                GROUP BY
                    ah.class_id,
                    status
            ) r ON c.id = r.class_id
            WHERE c.teacher_id = p_teacher_id
            GROUP BY c.id, c.name
        ) t) AS attendance_by_class,

        -- Aggregate Student Performance
        (SELECT COALESCE(array_to_json(array_agg(row_to_json(t))), '[]') FROM (
          SELECT 
            s.student_id as id,
            s.name,
            s.class_name as class,
            s.average_grade,
            s.attendance_percentage,
            CASE
              WHEN s.average_grade >= 90 AND s.attendance_percentage >= 95 THEN 'Sangat Baik'
              WHEN s.average_grade < 75 AND s.attendance_percentage < 85 THEN 'Berisiko'
              WHEN s.average_grade < 75 OR s.attendance_percentage < 85 THEN 'Butuh Perhatian'
              ELSE 'Stabil'
            END as status
          FROM student_stats s
        ) t) as student_performance;
END;
$$;
