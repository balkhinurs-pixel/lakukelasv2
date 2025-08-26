-- =================================================================
-- MIGRATION SCRIPT: NORMALIZE GRADES AND ATTENDANCE DATA
-- TUJUAN: Mengubah struktur penyimpanan nilai dan absensi dari
--         kolom JSON menjadi baris individual untuk performa
--         dan skalabilitas yang jauh lebih baik.
--
-- CARA PENGGUNAAN:
-- 1. Copy SELURUH isi file ini.
-- 2. Paste ke SQL Editor di Supabase Dashboard Anda.
-- 3. Klik "RUN".
--
-- PERINGATAN: SCRIPT INI AKAN MENGHAPUS TABEL 'grades' dan 'attendance'
-- YANG LAMA. PASTIKAN ANDA SUDAH SIAP UNTUK MIGRASI.
-- =================================================================

BEGIN;

-- 1. HAPUS TABEL LAMA YANG TIDAK EFISIEN
-- Menggunakan DROP TABLE yang benar, bukan DROP VIEW.
DROP TABLE IF EXISTS public.grades;
DROP TABLE IF EXISTS public.attendance;

-- 2. BUAT TABEL BARU YANG SUDAH DINORMALISASI
-- Tabel untuk menyimpan setiap entri nilai secara individual.
CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.grade_records IS 'Stores individual grade entries for each student.';

-- Tabel untuk menyimpan setiap entri absensi secara individual.
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    meeting_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    created_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.attendance_records IS 'Stores individual attendance entries for each student.';

-- 3. BUAT ATAU GANTI VIEW UNTUK MEMPERMUDAH PENGAMBILAN DATA
-- View ini menggabungkan data nilai dengan nama mapel, kelas, dll.
-- Ini akan membuat query dari aplikasi menjadi lebih sederhana.

-- Hapus view lama jika ada untuk memastikan definisi baru yang diterapkan.
DROP VIEW IF EXISTS public.grades_history;

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
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
    p.full_name as teacher_name,
    EXTRACT(MONTH FROM gr.date) as month
FROM 
    public.grade_records gr
JOIN 
    public.classes c ON gr.class_id = c.id
JOIN 
    public.subjects s ON gr.subject_id = s.id
JOIN 
    public.profiles p ON gr.teacher_id = p.id;

-- Hapus view lama jika ada.
DROP VIEW IF EXISTS public.attendance_history;

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
    c.name as class_name,
    s.name as subject_name,
    p.full_name as teacher_name,
    EXTRACT(MONTH FROM ar.date) as month
FROM 
    public.attendance_records ar
JOIN 
    public.classes c ON ar.class_id = c.id
JOIN 
    public.subjects s ON ar.subject_id = s.id
JOIN 
    public.profiles p ON ar.teacher_id = p.id;

-- Hapus view lama jika ada.
DROP VIEW IF EXISTS public.student_notes_with_teacher;
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.id,
    sn.student_id,
    sn.teacher_id,
    sn.date,
    sn.note,
    sn.type,
    p.full_name as teacher_name
FROM
    public.student_notes sn
JOIN
    public.profiles p ON sn.teacher_id = p.id;


-- 4. TAMBAHKAN INDEX UNTUK MEMPERCEPAT QUERY
-- Index ini krusial untuk performa saat data semakin banyak.
CREATE INDEX IF NOT EXISTS idx_grade_records_student_id ON public.grade_records(student_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_teacher_id ON public.grade_records(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_school_year_id ON public.grade_records(school_year_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_teacher_id ON public.attendance_records(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_school_year_id ON public.attendance_records(school_year_id);

-- 5. AKTIFKAN RLS (ROW LEVEL SECURITY) PADA TABEL BARU
-- Ini penting untuk keamanan data.
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- 6. BUAT KEBIJAKAN (POLICY) UNTUK RLS
-- Policy ini mengatur siapa bisa melakukan apa terhadap data.

-- Hapus policy lama jika ada untuk menghindari konflik
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.grade_records;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.attendance_records;

-- Policy baru: Semua pengguna yang sudah login (terautentikasi) bisa melakukan semua operasi.
-- Ini adalah pengaturan default yang aman untuk aplikasi internal seperti ini.
CREATE POLICY "Enable all access for authenticated users"
ON public.grade_records
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users"
ON public.attendance_records
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMIT;

-- Pesan sukses untuk user
SELECT 'Migrasi ke struktur data baru yang dinormalisasi berhasil diselesaikan.' as status;
