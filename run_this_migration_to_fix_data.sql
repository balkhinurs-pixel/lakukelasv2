-- Langkah 1: Buat tabel baru yang sudah dinormalisasi untuk nilai.
-- Tabel ini akan menyimpan setiap nilai siswa sebagai satu baris terpisah.
CREATE TABLE
  public.grade_records (
    id UUID DEFAULT gen_random_uuid () NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    student_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    class_id UUID NOT NULL,
    date DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    score REAL NOT NULL,
    teacher_id UUID NOT NULL,
    school_year_id UUID,
    CONSTRAINT grade_records_pkey PRIMARY KEY (id),
    CONSTRAINT grade_records_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT grade_records_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES school_years (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT grade_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT grade_records_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT grade_records_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES profiles (id) ON UPDATE CASCADE ON DELETE CASCADE
  ) TABLESPACE pg_default;

-- Langkah 2: Buat tabel baru yang sudah dinormalisasi untuk absensi.
-- Tabel ini akan menyimpan setiap absensi siswa sebagai satu baris terpisah.
CREATE TABLE
  public.attendance_records (
    id UUID DEFAULT gen_random_uuid () NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    student_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    class_id UUID NOT NULL,
    date DATE NOT NULL,
    meeting_number INTEGER NOT NULL,
    status TEXT NOT NULL,
    teacher_id UUID NOT NULL,
    school_year_id UUID,
    CONSTRAINT attendance_records_pkey PRIMARY KEY (id),
    CONSTRAINT attendance_records_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT attendance_records_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES school_years (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT attendance_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES students (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT attendance_records_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT attendance_records_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES profiles (id) ON UPDATE CASCADE ON DELETE CASCADE
  ) TABLESPACE pg_default;

-- Langkah 3: Tambahkan Indeks untuk mempercepat pencarian data
CREATE INDEX idx_grade_records_student_id ON public.grade_records USING btree (student_id);
CREATE INDEX idx_grade_records_school_year_id ON public.grade_records USING btree (school_year_id);
CREATE INDEX idx_attendance_records_student_id ON public.attendance_records USING btree (student_id);
CREATE INDEX idx_attendance_records_school_year_id ON public.attendance_records USING btree (school_year_id);
CREATE INDEX idx_attendance_date ON public.attendance_records USING btree (date);
CREATE INDEX idx_grades_date ON public.grade_records USING btree (date);


-- Langkah 4: Hapus view lama yang tidak efisien
DROP VIEW IF EXISTS public.grades;
DROP VIEW IF EXISTS public.attendance;
DROP VIEW IF EXISTS public.attendance_history;
DROP VIEW IF EXISTS public.grades_history;

-- Langkah 5: Hapus tabel lama yang menggunakan kolom JSON
-- PENTING: Lakukan backup jika Anda memiliki data penting di tabel ini.
-- Script ini mengasumsikan data lama boleh dihapus untuk memulai dengan struktur baru.
DROP TABLE IF EXISTS public.grades;
DROP TABLE IF EXISTS public.attendance;

-- Langkah 6: Buat Ulang View dengan Struktur yang Benar (opsional, tapi bagus untuk konsistensi)
-- View ini akan membantu menyederhanakan query di aplikasi jika diperlukan.
CREATE VIEW public.grades_history AS
SELECT
  g.id,
  g.date,
  g.assessment_type,
  g.class_id,
  g.subject_id,
  g.teacher_id,
  g.school_year_id,
  g.score,
  g.student_id,
  c.name AS class_name,
  s.name AS subject_name,
  s.kkm AS subject_kkm,
  p.full_name AS teacher_name
FROM
  grade_records g
  LEFT JOIN classes c ON g.class_id = c.id
  LEFT JOIN subjects s ON g.subject_id = s.id
  LEFT JOIN profiles p ON g.teacher_id = p.id;
  
CREATE VIEW public.attendance_history AS
SELECT
  g.id,
  g.date,
  g.meeting_number,
  g.class_id,
  g.subject_id,
  g.teacher_id,
  g.school_year_id,
  g.status,
  g.student_id,
  c.name AS class_name,
  s.name AS subject_name,
  p.full_name AS teacher_name
FROM
  attendance_records g
  LEFT JOIN classes c ON g.class_id = c.id
  LEFT JOIN subjects s ON g.subject_id = s.id
  LEFT JOIN profiles p ON g.teacher_id = p.id;

-- Selesai! Struktur database Anda sekarang sudah jauh lebih baik.
