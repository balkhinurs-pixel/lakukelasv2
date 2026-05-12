-- Skrip Migrasi untuk Menambahkan Status Siswa
-- Jalankan kode ini SATU KALI di SQL Editor Supabase Anda
-- untuk memperbarui database yang sudah ada.

-- Langkah 1: Tambahkan kolom 'status' ke tabel 'students'
-- Kolom ini akan diisi dengan 'active' secara default untuk semua siswa yang sudah ada.
ALTER TABLE public.students
ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- Langkah 2: Perbarui Kebijakan Keamanan (RLS)
-- Kita perlu memperbarui RLS agar guru tetap bisa mengubah status siswanya (misalnya meluluskan).
-- Kebijakan lama akan dihapus dan dibuat ulang dengan izin yang sama.
DROP POLICY IF EXISTS "Teachers can update their own students" ON public.students;
CREATE POLICY "Teachers can update their own students"
ON public.students
FOR UPDATE USING (
  auth.uid() = (
    SELECT teacher_id FROM classes WHERE id = students.class_id
  )
);

-- Migrasi selesai. Anda tidak perlu menjalankan ini lagi.
