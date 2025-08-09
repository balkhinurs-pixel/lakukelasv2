-- ----------------------------
-- Skema Database untuk Lakukelas
-- ----------------------------

-- 1. Tabel untuk PROFIL PENGGUNA (PROFILES)
-- Tabel ini menyimpan data tambahan untuk pengguna yang terdaftar di Supabase Auth.
-- Terhubung dengan tabel `auth.users` melalui `id`.
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text NOT NULL,
    email text,
    avatar_url text,
    nip text,
    pangkat text,
    jabatan text,
    school_name text,
    school_address text,
    headmaster_name text,
    headmaster_nip text,
    school_logo_url text,
    account_status text DEFAULT 'Free'::text NOT NULL CHECK (account_status IN ('Free', 'Pro'))
);
-- Tambahkan komentar untuk kejelasan
COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user.';
COMMENT ON COLUMN public.profiles.id IS 'Foreign key to auth.users.id';

-- 2. Tabel untuk KELAS (CLASSES)
-- Menyimpan daftar kelas yang diajar oleh guru.
CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.classes IS 'Stores class information managed by teachers.';

-- 3. Tabel untuk MATA PELAJARAN (SUBJECTS)
-- Menyimpan daftar mata pelajaran yang diajar.
CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    kkm integer DEFAULT 75 NOT NULL,
    teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.subjects IS 'Stores subjects taught by teachers, including the minimum passing score (KKM).';

-- 4. Tabel untuk SISWA (STUDENTS)
-- Menyimpan data siswa, terhubung dengan sebuah kelas.
CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    nis text,
    nisn text,
    gender text CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.students IS 'Stores student data, linked to a specific class.';

-- 5. Tabel untuk JADWAL (SCHEDULE)
-- Menyimpan jadwal mengajar mingguan.
CREATE TABLE public.schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    day text NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.schedule IS 'Stores the weekly teaching schedule.';

-- 6. Tabel untuk JURNAL MENGAJAR (JOURNALS)
-- Menyimpan entri jurnal mengajar harian.
CREATE TABLE public.journals (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    date date DEFAULT now() NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text
);
COMMENT ON TABLE public.journals IS 'Stores daily teaching journal entries.';

-- 7. Tabel untuk RIWAYAT PRESENSI (ATTENDANCE_HISTORY)
-- Menyimpan rekaman presensi untuk setiap pertemuan.
CREATE TABLE public.attendance_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer NOT NULL,
    records jsonb NOT NULL -- e.g. [{"studentId": "uuid", "status": "Hadir"}]
);
COMMENT ON TABLE public.attendance_history IS 'Stores attendance records for each session.';

-- 8. Tabel untuk RIWAYAT NILAI (GRADE_HISTORY)
-- Menyimpan rekaman nilai untuk setiap penilaian.
CREATE TABLE public.grade_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb NOT NULL -- e.g. [{"studentId": "uuid", "score": 95}]
);
COMMENT ON TABLE public.grade_history IS 'Stores grade records for each assessment.';

-- 9. Tabel untuk KODE AKTIVASI (ACTIVATION_CODES)
-- Menyimpan kode unik untuk aktivasi akun Pro.
CREATE TABLE public.activation_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    code text NOT NULL UNIQUE,
    is_used boolean DEFAULT false NOT NULL,
    used_at timestamp with time zone,
    used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.activation_codes IS 'Stores activation codes for Pro accounts.';


-- ----------------------------
-- Kebijakan Keamanan (Row Level Security - RLS)
-- ----------------------------

-- Aktifkan RLS untuk semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;


-- Kebijakan untuk PROFILES
-- Pengguna bisa melihat profil mereka sendiri.
-- Pengguna bisa memperbarui profil mereka sendiri.
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Kebijakan untuk CLASSES
-- Pengguna bisa melihat, membuat, mengubah, dan menghapus kelas milik mereka sendiri.
CREATE POLICY "Users can manage their own classes" ON public.classes FOR ALL USING (auth.uid() = teacher_id);

-- Kebijakan untuk SUBJECTS
-- Pengguna bisa melihat, membuat, mengubah, dan menghapus mapel milik mereka sendiri.
CREATE POLICY "Users can manage their own subjects" ON public.subjects FOR ALL USING (auth.uid() = teacher_id);

-- Kebijakan untuk STUDENTS
-- Pengguna hanya bisa mengelola siswa di kelas yang mereka miliki.
CREATE POLICY "Users can manage students in their own classes" ON public.students FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.classes
    WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);

-- Kebijakan untuk SCHEDULE
-- Pengguna hanya bisa mengelola jadwal milik mereka sendiri.
CREATE POLICY "Users can manage their own schedule" ON public.schedule FOR ALL USING (auth.uid() = teacher_id);

-- Kebijakan untuk JOURNALS
-- Pengguna hanya bisa mengelola jurnal milik mereka sendiri.
CREATE POLICY "Users can manage their own journals" ON public.journals FOR ALL USING (auth.uid() = teacher_id);

-- Kebijakan untuk ATTENDANCE_HISTORY
-- Pengguna hanya bisa mengelola riwayat presensi dari kelas yang mereka ajar.
CREATE POLICY "Users can manage attendance for their own classes" ON public.attendance_history FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.classes
    WHERE classes.id = attendance_history.class_id AND classes.teacher_id = auth.uid()
  )
);

-- Kebijakan untuk GRADE_HISTORY
-- Pengguna hanya bisa mengelola riwayat nilai dari kelas yang mereka ajar.
CREATE POLICY "Users can manage grades for their own classes" ON public.grade_history FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.classes
    WHERE classes.id = grade_history.class_id AND classes.teacher_id = auth.uid()
  )
);

-- Kebijakan untuk ACTIVATION_CODES (Hanya untuk Admin - diasumsikan peran 'admin' ada)
-- Secara default, non-admin tidak bisa melihat atau mengubah kode.
-- Admin bisa melakukan segalanya.
-- Untuk production, Anda harus membuat peran 'admin' di Supabase.
-- CREATE POLICY "Admins can manage activation codes" ON public.activation_codes FOR ALL
-- USING (get_my_claim('user_role') = 'admin'::jsonb)
-- WITH CHECK (get_my_claim('user_role') = 'admin'::jsonb);

-- Kebijakan sementara: Izinkan pengguna terotentikasi membaca kode (tidak ideal untuk produksi)
-- dan tidak bisa mengubah apapun.
CREATE POLICY "Allow authenticated users to read codes" ON public.activation_codes FOR SELECT
USING (auth.role() = 'authenticated');


-- ----------------------------
-- Fungsi dan Pemicu (Triggers)
-- ----------------------------

-- Fungsi untuk membuat profil baru secara otomatis saat pengguna baru mendaftar.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$;

-- Pemicu (trigger) yang akan menjalankan fungsi di atas setelah ada user baru.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Inisialisasi: Berikan hak pada peran `service_role` (diperlukan oleh trigger)
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.classes TO service_role;
GRANT ALL ON TABLE public.subjects TO service_role;
GRANT ALL ON TABLE public.students TO service_role;
GRANT ALL ON TABLE public.schedule TO service_role;
GRANT ALL ON TABLE public.journals TO service_role;
GRANT ALL ON TABLE public.attendance_history TO service_role;
GRANT ALL ON TABLE public.grade_history TO service_role;
GRANT ALL ON TABLE public.activation_codes TO service_role;

-- Selesai. Anda sekarang bisa menjalankan skrip ini di SQL Editor Supabase.
