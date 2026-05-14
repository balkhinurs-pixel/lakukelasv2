# Log Pembaruan LakuKelas

## V8.0: Presensi Kolaboratif & Sinkronisasi Cerdas (TERIMPLEMENTASI)
Optimisasi alur kerja guru untuk efisiensi input data dan pemantauan real-time oleh Wali Kelas.

### 1. Konsep "First Input Base"
- **Logika**: Guru mata pelajaran yang melakukan input presensi pertama kali di suatu kelas (pada hari tersebut) akan menentukan status awal seluruh siswa.
- **Penerapan**: Data ini menjadi referensi utama bagi sistem untuk hari itu.

### 2. Fitur "Inherit & Update" bagi Guru
- **Alur Kerja**: Guru di jam pelajaran berikutnya tidak akan menerima formulir kosong. Sistem otomatis mengisi formulir berdasarkan data presensi terakhir di hari yang sama.
- **Efisiensi**: Guru hanya perlu melakukan perubahan (adjustment) jika ada perubahan status siswa (misal: siswa terlambat hadir atau izin pulang di tengah pelajaran).
- **Manfaat**: Menghemat waktu input guru hingga 80% per sesi dan menjaga konsistensi data antar jam pelajaran.

### 3. Real-time Monitoring Wali Kelas
- **Akses**: Wali kelas dapat melihat status kehadiran siswa di kelas perwaliannya secara langsung (live) melalui menu "Progres Siswa".
- **Visualisasi**: Ditambahkan kartu status hari ini yang merinci siapa saja yang Hadir, Sakit, Izin, atau Alpha berdasarkan input guru mapel terakhir.

### 4. Protokol Pembaruan SQL (SANGAT PENTING)
Untuk memperbarui database yang sudah ada tanpa error, gunakan potongan skrip berikut di SQL Editor Supabase:

```sql
-- Hapus view lama terlebih dahulu untuk menghindari error redefinisi kolom (42P16)
DROP VIEW IF EXISTS public.attendance_history CASCADE;
DROP VIEW IF EXISTS public.grades_history CASCADE;
DROP VIEW IF EXISTS public.journal_entries_with_names CASCADE;

-- Indexing untuk kecepatan fitur "Inherit & Update"
CREATE INDEX IF NOT EXISTS idx_attendance_records_collaboration 
ON public.attendance_records (class_id, date, meeting_number DESC);

-- View untuk Riwayat Presensi
CREATE VIEW public.attendance_history AS
SELECT 
    ar.id, ar.date, ar.meeting_number, ar.class_id, ar.subject_id, ar.teacher_id, ar.school_year_id, ar.status, ar.student_id,
    c.name as class_name, s.name as subject_name, p.full_name as teacher_name
FROM attendance_records ar
JOIN classes c ON ar.class_id = c.id
JOIN subjects s ON ar.subject_id = s.id
JOIN profiles p ON ar.teacher_id = p.id;

-- View untuk Riwayat Nilai
CREATE VIEW public.grades_history AS
SELECT 
    gr.id, gr.date, gr.assessment_type, gr.class_id, gr.subject_id, gr.teacher_id, gr.school_year_id, gr.score, gr.student_id,
    c.name as class_name, s.name as subject_name, s.kkm as subject_kkm, p.full_name as teacher_name
FROM grade_records gr
JOIN classes c ON gr.class_id = c.id
JOIN subjects s ON gr.subject_id = s.id
JOIN profiles p ON gr.teacher_id = p.id;

-- View untuk Jurnal Mengajar
CREATE VIEW public.journal_entries_with_names AS
SELECT 
    je.*, c.name as "className", s.name as "subjectName"
FROM journal_entries je
JOIN classes c ON je.class_id = c.id
JOIN subjects s ON je.subject_id = s.id;

-- RPC untuk Dashboard Monitoring
CREATE OR REPLACE FUNCTION public.get_teacher_attendance_summary(p_date DATE)
RETURNS TABLE (
    total_expected BIGINT, total_present BIGINT, total_late BIGINT, total_absent BIGINT, attendance_rate NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_policy TEXT;
BEGIN
    SELECT value INTO v_policy FROM settings WHERE key = 'attendance_policy';
    RETURN QUERY
    WITH expected_ids AS (
        SELECT id FROM profiles WHERE role IN ('teacher', 'headmaster')
        AND (v_policy = 'daily_based' OR id IN (SELECT teacher_id FROM schedule WHERE day = 
            CASE extract(dow from p_date)
                WHEN 0 THEN 'Minggu' WHEN 1 THEN 'Senin' WHEN 2 THEN 'Selasa' WHEN 3 THEN 'Rabu'
                WHEN 4 THEN 'Kamis' WHEN 5 THEN 'Jumat' WHEN 6 THEN 'Sabtu' END))
    )
    SELECT 
        count(e.id)::BIGINT,
        count(a.id) FILTER (WHERE a.status IN ('Tepat Waktu', 'Terlambat'))::BIGINT,
        count(a.id) FILTER (WHERE a.status = 'Terlambat')::BIGINT,
        (count(e.id) - count(a.id) FILTER (WHERE a.status IN ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin')))::BIGINT,
        CASE WHEN count(e.id) = 0 THEN 100::NUMERIC ELSE round((count(a.id) FILTER (WHERE a.status IN ('Tepat Waktu', 'Terlambat'))::NUMERIC / count(e.id)::NUMERIC) * 100, 2) END
    FROM expected_ids e
    LEFT JOIN teacher_attendance a ON e.id = a.teacher_id AND a.date = p_date;
END;
$$;

-- RPC untuk Statistik Aktivitas Guru
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
    teacher_id UUID, attendance_count BIGINT, grades_count BIGINT, journal_count BIGINT, classes_handled_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        (SELECT count(DISTINCT (date, class_id, subject_id, meeting_number)) FROM attendance_records WHERE teacher_id = p.id),
        (SELECT count(DISTINCT (date, class_id, subject_id, assessment_type)) FROM grade_records WHERE teacher_id = p.id),
        (SELECT count(*) FROM journal_entries WHERE teacher_id = p.id),
        (SELECT count(DISTINCT class_id) FROM schedule WHERE teacher_id = p.id)
    FROM profiles p
    WHERE p.role IN ('teacher', 'headmaster');
END;
$$;
```

---

## V7.0: Konsolidasi Skema SQL Utama (TERIMPLEMENTASI)
Optimalisasi untuk deployment mandiri dan migrasi proyek Supabase.
- Penyediaan file `schema.sql` yang idempotent (aman dijalankan berulang kali).
- Penguatan aturan RLS untuk keamanan multi-role (Guru, Wali Kelas, Kepsek).
- Otomatisasi profil pengguna baru melalui PostgreSQL Trigger.
