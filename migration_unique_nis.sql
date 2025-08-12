
-- 1. Hapus batasan unik pada kolom `nis` jika ada
DO $$
BEGIN
   IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_nis_key') THEN
      ALTER TABLE public.students DROP CONSTRAINT students_nis_key;
   END IF;
END $$;

-- 2. Tambahkan batasan unik pada kombinasi `teacher_id` dan `nis`
ALTER TABLE public.students
ADD CONSTRAINT students_teacher_id_nis_key UNIQUE (teacher_id, nis);

-- Catatan:
-- Jika skrip ini gagal karena ada data NIS duplikat untuk guru yang sama,
-- Anda perlu menghapus data duplikat tersebut secara manual sebelum menjalankan migrasi ini.
-- Anda bisa menggunakan query berikut untuk menemukan data duplikat:
/*
SELECT teacher_id, nis, COUNT(*)
FROM public.students
GROUP BY teacher_id, nis
HAVING COUNT(*) > 1;
*/
