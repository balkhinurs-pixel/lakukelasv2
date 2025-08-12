-- MIGRATION SCRIPT: Menambahkan school_year_id ke tabel yang ada
-- Aman untuk dijalankan beberapa kali.

-- 1. Tambah kolom 'school_year_id' ke tabel 'journals' jika belum ada.
ALTER TABLE public.journals
ADD COLUMN IF NOT EXISTS school_year_id UUID;

-- 2. Tambah kolom 'school_year_id' ke tabel 'attendance_history' jika belum ada.
ALTER TABLE public.attendance_history
ADD COLUMN IF NOT EXISTS school_year_id UUID;

-- 3. Tambah kolom 'school_year_id' ke tabel 'grade_history' jika belum ada.
ALTER TABLE public.grade_history
ADD COLUMN IF NOT EXISTS school_year_id UUID;

-- 4. Tambahkan Foreign Key constraint ke tabel 'journals' jika belum ada.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_constraint
        WHERE  conname = 'journals_school_year_id_fkey'
    )
    THEN
        ALTER TABLE public.journals
        ADD CONSTRAINT journals_school_year_id_fkey
        FOREIGN KEY (school_year_id)
        REFERENCES public.school_years(id)
        ON DELETE SET NULL;
    END IF;
END;
$$;

-- 5. Tambahkan Foreign Key constraint ke tabel 'attendance_history' jika belum ada.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_constraint
        WHERE  conname = 'attendance_history_school_year_id_fkey'
    )
    THEN
        ALTER TABLE public.attendance_history
        ADD CONSTRAINT attendance_history_school_year_id_fkey
        FOREIGN KEY (school_year_id)
        REFERENCES public.school_years(id)
        ON DELETE SET NULL;
    END IF;
END;
$$;


-- 6. Tambahkan Foreign Key constraint ke tabel 'grade_history' jika belum ada.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_constraint
        WHERE  conname = 'grade_history_school_year_id_fkey'
    )
    THEN
        ALTER TABLE public.grade_history
        ADD CONSTRAINT grade_history_school_year_id_fkey
        FOREIGN KEY (school_year_id)
        REFERENCES public.school_years(id)
        ON DELETE SET NULL;
    END IF;
END;
$$;

-- 7. Isi kolom school_year_id untuk data yang sudah ada di tabel 'journals'.
--    Menggunakan tahun ajaran aktif dari profil guru yang bersangkutan.
UPDATE public.journals j
SET school_year_id = p.active_school_year_id
FROM public.profiles p
WHERE j.teacher_id = p.id AND j.school_year_id IS NULL AND p.active_school_year_id IS NOT NULL;

-- 8. Isi kolom school_year_id untuk data yang sudah ada di tabel 'attendance_history'.
UPDATE public.attendance_history ah
SET school_year_id = p.active_school_year_id
FROM public.profiles p
WHERE ah.teacher_id = p.id AND ah.school_year_id IS NULL AND p.active_school_year_id IS NOT NULL;

-- 9. Isi kolom school_year_id untuk data yang sudah ada di tabel 'grade_history'.
UPDATE public.grade_history gh
SET school_year_id = p.active_school_year_id
FROM public.profiles p
WHERE gh.teacher_id = p.id AND gh.school_year_id IS NULL AND p.active_school_year_id IS NOT NULL;

COMMENT ON COLUMN public.journals.school_year_id IS 'Foreign key ke tabel school_years';
COMMENT ON COLUMN public.attendance_history.school_year_id IS 'Foreign key ke tabel school_years';
COMMENT ON COLUMN public.grade_history.school_year_id IS 'Foreign key ke tabel school_years';
