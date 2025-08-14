-- Hapus fungsi lama jika ada untuk memastikan kita memulai dari awal.
-- Ini aman untuk dijalankan meskipun fungsinya tidak ada.
DROP FUNCTION IF EXISTS public.get_report_data(p_teacher_id uuid, p_school_year_id uuid, p_month integer);
