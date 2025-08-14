-- Langkah 1: Hapus data duplikat, hanya simpan entri yang paling awal dibuat.
-- Kita menggunakan 'ctid' yang merupakan pengenal unik internal untuk setiap baris.
DELETE FROM public.school_years a
WHERE a.ctid <> (
    SELECT min(b.ctid)
    FROM public.school_years b
    WHERE a.name = b.name AND a.teacher_id = b.teacher_id
);

-- Langkah 2: Tambahkan batasan UNIK ke tabel untuk mencegah duplikasi di masa depan.
-- Perintah ini akan gagal jika masih ada duplikat, itulah mengapa langkah 1 penting.
-- 'IF NOT EXISTS' akan mencegah error jika batasan sudah ada.
ALTER TABLE public.school_years
ADD CONSTRAINT IF NOT EXISTS unique_school_year_for_teacher UNIQUE (name, teacher_id);

-- Catatan: Jika Anda mendapatkan error pada langkah 2, itu berarti langkah 1 gagal menghapus semua duplikat.
-- Pastikan tidak ada kondisi aneh pada data Anda, lalu coba jalankan kembali langkah 1.
