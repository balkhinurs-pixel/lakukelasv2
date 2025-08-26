-- ⚠️ PERHATIAN: JALANKAN SCRIPT INI DI SUPABASE SQL EDITOR
-- Script ini akan mengubah struktur database Anda untuk meningkatkan performa dan efisiensi.
-- PASTIKAN ANDA MEMILIKI BACKUP JIKA DIPERLUKAN.

-- Menonaktifkan notice untuk mengurangi noise output
SET client_min_messages TO WARNING;

BEGIN;

-- 1. Menghapus tabel lama yang tidak efisien beserta view yang bergantung padanya
DROP TABLE IF EXISTS public.grades CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;

-- 2. Membuat tabel baru yang sudah dinormalisasi untuk menyimpan nilai
CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    score NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.grade_records IS 'Tabel individual untuk setiap entri nilai siswa.';

-- 3. Membuat tabel baru yang sudah dinormalisasi untuk menyimpan absensi
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    meeting_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.attendance_records IS 'Tabel individual untuk setiap entri absensi siswa.';

-- 4. Membuat ulang view (view) untuk riwayat nilai dengan struktur baru
CREATE OR REPLACE VIEW public.grades_history AS
SELECT
    gr.id,
    gr.date,
    gr.assessment_type,
    gr.class_id,
    gr.subject_id,
    gr.teacher_id,
    gr.school_year_id,
    gr.score,
    gr.student_id,
    c.name AS class_name,
    s.name AS subject_name,
    s.kkm AS subject_kkm,
    p.full_name AS teacher_name
FROM
    public.grade_records gr
JOIN
    public.classes c ON gr.class_id = c.id
JOIN
    public.subjects s ON gr.subject_id = s.id
LEFT JOIN
    public.profiles p ON gr.teacher_id = p.id;

-- 5. Membuat ulang view (view) untuk riwayat absensi dengan struktur baru
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT
    ar.id,
    ar.date,
    ar.meeting_number,
    ar.class_id,
    ar.subject_id,
    ar.teacher_id,
    ar.school_year_id,
    ar.status,
    ar.student_id,
    c.name AS class_name,
    s.name AS subject_name,
    p.full_name AS teacher_name
FROM
    public.attendance_records ar
JOIN
    public.classes c ON ar.class_id = c.id
JOIN
    public.subjects s ON ar.subject_id = s.id
LEFT JOIN
    public.profiles p ON ar.teacher_id = p.id;

-- 6. Memberikan hak akses pada tabel dan view baru
GRANT SELECT ON public.grade_records TO authenticated;
GRANT INSERT ON public.grade_records TO authenticated;
GRANT UPDATE ON public.grade_records TO authenticated;
GRANT DELETE ON public.grade_records TO authenticated;

GRANT SELECT ON public.attendance_records TO authenticated;
GRANT INSERT ON public.attendance_records TO authenticated;
GRANT UPDATE ON public.attendance_records TO authenticated;
GRANT DELETE ON public.attendance_records TO authenticated;

GRANT SELECT ON public.grades_history TO authenticated;
GRANT SELECT ON public.attendance_history TO authenticated;

-- 7. Menambahkan index untuk mempercepat query
CREATE INDEX IF NOT EXISTS idx_grade_records_student_id ON public.grade_records(student_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_school_year_id ON public.grade_records(school_year_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_school_year_id ON public.attendance_records(school_year_id);

-- Mengembalikan pengaturan pesan ke default
RESET client_min_messages;

COMMIT;

SELECT 'Migrasi struktur data nilai dan presensi berhasil diselesaikan.' as status;
