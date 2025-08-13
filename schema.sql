
-- ### PROFILES ###
-- Tabel ini menyimpan data publik untuk setiap pengguna.
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  nip TEXT,
  pangkat TEXT,
  jabatan TEXT,
  school_name TEXT,
  school_address TEXT,
  headmaster_name TEXT,
  headmaster_nip TEXT,
  school_logo_url TEXT,
  role TEXT DEFAULT 'teacher',
  account_status TEXT DEFAULT 'Free',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  active_school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- ### SCHOOL YEARS ###
-- Tabel untuk menyimpan tahun ajaran (e.g., "2023/2024 - Ganjil")
CREATE TABLE public.school_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own school years." ON public.school_years FOR ALL USING (auth.uid() = teacher_id);


-- ### CLASSES ###
-- Tabel untuk menyimpan kelas yang diajar oleh guru.
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own classes." ON public.classes FOR ALL USING (auth.uid() = teacher_id);


-- ### SUBJECTS ###
-- Tabel untuk menyimpan mata pelajaran yang diajar.
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    kkm INTEGER NOT NULL DEFAULT 75,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own subjects." ON public.subjects FOR ALL USING (auth.uid() = teacher_id);


-- ### STUDENTS ###
-- Tabel untuk menyimpan data siswa.
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nis TEXT NOT NULL,
    gender TEXT NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' atau 'graduated'
    created_at TIMESTAMPTZ DEFAULT now(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view students in their classes." ON public.students FOR SELECT USING (auth.uid() = (SELECT teacher_id FROM classes WHERE id = students.class_id));
CREATE POLICY "Teachers can insert students into their own classes." ON public.students FOR INSERT WITH CHECK (auth.uid() = (SELECT teacher_id FROM classes WHERE id = students.class_id));
CREATE POLICY "Teachers can update their own students" ON public.students FOR UPDATE USING (auth.uid() = (SELECT teacher_id FROM classes WHERE id = students.class_id));
-- RLS untuk delete akan ditangani oleh on delete cascade dari tabel classes.
ALTER TABLE public.students ADD CONSTRAINT unique_teacher_nis UNIQUE (teacher_id, nis);

-- ### SCHEDULE ###
-- Tabel untuk jadwal mengajar mingguan.
CREATE TABLE public.schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own schedule." ON public.schedule FOR ALL USING (auth.uid() = teacher_id);

-- ### ATTENDANCE HISTORY ###
CREATE TABLE public.attendance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
    meeting_number INTEGER,
    records JSONB, -- e.g., [{"student_id": "uuid", "status": "Hadir"}, ...]
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(date, class_id, subject_id, meeting_number, teacher_id)
);
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own attendance history." ON public.attendance_history FOR ALL USING (auth.uid() = teacher_id);


-- ### GRADE HISTORY ###
CREATE TABLE public.grade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
    assessment_type TEXT NOT NULL,
    records JSONB, -- e.g., [{"student_id": "uuid", "score": 85}, ...]
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own grade history." ON public.grade_history FOR ALL USING (auth.uid() = teacher_id);


-- ### JOURNALS ###
CREATE TABLE public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own journals." ON public.journals FOR ALL USING (auth.uid() = teacher_id);


-- ### AGENDAS ###
CREATE TABLE public.agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own agendas." ON public.agendas FOR ALL USING (auth.uid() = teacher_id);


-- ### ACTIVATION CODES ###
CREATE TABLE public.activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Note: RLS for activation_codes is handled by server-side logic and database functions for security.


-- =================================================================
--                       FUNCTIONS AND TRIGGERS
-- =================================================================

-- ### FUNGSI UNTUK OTOMATIS MEMBUAT PROFIL SAAT USER BARU DAFTAR ###
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Tambahkan email dan full_name dari data auth.users ke profiles
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, account_status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'teacher', -- default role
    'Free'     -- default status
  );

  -- Set teacher_id untuk semua entitas yang dibuat oleh pengguna ini
  UPDATE public.students SET teacher_id = NEW.id WHERE class_id IN (SELECT id FROM public.classes WHERE teacher_id = NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ### TRIGGER UNTUK FUNGSI handle_new_user ###
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ### FUNGSI UNTUK OTOMATIS MENGHAPUS PROFIL SAAT USER DIHAPUS ###
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ### TRIGGER UNTUK FUNGSI handle_user_delete ###
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();


-- ### FUNGSI UNTUK MENGISI teacher_id DI SISWA SECARA OTOMATIS ###
CREATE OR REPLACE FUNCTION public.set_student_teacher_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT teacher_id INTO NEW.teacher_id
  FROM public.classes
  WHERE id = NEW.class_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ### TRIGGER UNTUK FUNGSI set_student_teacher_id ###
CREATE TRIGGER before_student_insert_set_teacher
  BEFORE INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.set_student_teacher_id();


-- ### FUNGSI UNTUK PROSES AKTIVASI AKUN ###
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    activation_code_to_use TEXT,
    user_id_to_activate UUID,
    user_email_to_set TEXT
)
RETURNS void AS $$
DECLARE
    code_id UUID;
    code_is_used BOOLEAN;
BEGIN
    -- 1. Periksa apakah kode valid dan belum digunakan
    SELECT id, is_used INTO code_id, code_is_used
    FROM public.activation_codes
    WHERE code = activation_code_to_use;

    IF code_id IS NULL THEN
        RAISE EXCEPTION 'Code not found';
    END IF;

    IF code_is_used THEN
        RAISE EXCEPTION 'Code already used';
    END IF;

    -- 2. Update tabel profiles untuk menjadikan akun Pro
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;

    -- 3. Update tabel activation_codes untuk menandai kode sudah digunakan
    UPDATE public.activation_codes
    SET 
        is_used = true,
        used_by = user_id_to_activate,
        used_at = now()
    WHERE id = code_id;

    -- 4. Update email di tabel profiles jika belum ada
    UPDATE public.profiles
    SET email = user_email_to_set
    WHERE id = user_id_to_activate AND email IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ### FUNGSI UNTUK MENAMBAHKAN SISWA DENGAN PENGECEKAN GURU ###
CREATE OR REPLACE FUNCTION public.add_student_with_teacher_check(
    p_class_id UUID,
    p_nis TEXT,
    p_name TEXT,
    p_gender TEXT
) RETURNS void AS $$
DECLARE
    v_teacher_id UUID;
BEGIN
    -- Dapatkan teacher_id dari class_id yang diberikan
    SELECT teacher_id INTO v_teacher_id FROM public.classes WHERE id = p_class_id;

    -- Periksa apakah guru yang sedang login sama dengan pemilik kelas
    IF v_teacher_id != auth.uid() THEN
        RAISE EXCEPTION 'User is not authorized to add students to this class';
    END IF;

    -- Periksa apakah NIS sudah ada untuk guru ini
    IF EXISTS (SELECT 1 FROM public.students WHERE teacher_id = v_teacher_id AND nis = p_nis) THEN
        RAISE EXCEPTION 'NIS already exists for this teacher';
    END IF;

    -- Masukkan siswa baru
    INSERT INTO public.students (name, nis, gender, class_id, teacher_id, status)
    VALUES (p_name, p_nis, p_gender, p_class_id, v_teacher_id, 'active');
END;
$$ LANGUAGE plpgsql;


-- =================================================================
--                           VIEWS (TAMPILAN)
-- =================================================================
CREATE OR REPLACE VIEW public.v_attendance_history AS
SELECT 
    ah.id,
    ah.date,
    ah.class_id,
    c.name as class_name,
    ah.subject_id,
    s.name as subject_name,
    ah.school_year_id,
    ah.meeting_number,
    ah.records,
    ah.teacher_id,
    (SELECT json_object_agg(st.id, st.name)
     FROM jsonb_to_recordset(ah.records) as r(student_id uuid, status text)
     JOIN students st ON st.id = r.student_id) as student_names
FROM 
    public.attendance_history ah
JOIN 
    public.classes c ON ah.class_id = c.id
JOIN 
    public.subjects s ON ah.subject_id = s.id;


CREATE OR REPLACE VIEW public.v_grade_history AS
SELECT 
    gh.id,
    gh.date,
    gh.class_id,
    c.name as class_name,
    gh.subject_id,
    s.name as subject_name,
    gh.school_year_id,
    gh.assessment_type,
    gh.records,
    gh.teacher_id,
    (SELECT json_object_agg(st.id, st.name)
     FROM jsonb_to_recordset(gh.records) as r(student_id uuid, score text)
     JOIN students st ON st.id = r.student_id) as student_names
FROM 
    public.grade_history gh
JOIN 
    public.classes c ON gh.class_id = c.id
JOIN 
    public.subjects s ON gh.subject_id = s.id;
