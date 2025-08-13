-- Skrip Migrasi untuk Membuat Views Laporan
-- Jalankan skrip ini SATU KALI di SQL Editor Supabase Anda.

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
    c.name as class_name,
    s.name as subject_name,
    (
        SELECT jsonb_object_agg(st.id, st.name)
        FROM jsonb_to_recordset(ah.records) as r(student_id uuid, status text)
        JOIN students st on st.id = r.student_id
    ) as student_names
FROM 
    attendance_history ah
JOIN 
    classes c ON ah.class_id = c.id
JOIN 
    subjects s ON ah.subject_id = s.id;


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
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
     (
        SELECT jsonb_object_agg(st.id, st.name)
        FROM jsonb_to_recordset(gh.records) as r(student_id uuid, score text)
        JOIN students st on st.id = r.student_id
    ) as student_names
FROM 
    grade_history gh
JOIN 
    classes c ON gh.class_id = c.id
JOIN 
    subjects s ON gh.subject_id = s.id;
