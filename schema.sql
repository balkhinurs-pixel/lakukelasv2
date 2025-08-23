
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Classes, Subjects, Students, Schedule (Admin only for write operations)
CREATE POLICY "All users can view classes, subjects, students, and schedule." ON public.classes FOR SELECT USING (true);
CREATE POLICY "All users can view classes, subjects, students, and schedule." ON public.subjects FOR SELECT USING (true);
CREATE POLICY "All users can view classes, subjects, students, and schedule." ON public.students FOR SELECT USING (true);
CREATE POLICY "All users can view classes, subjects, students, and schedule." ON public.schedule FOR SELECT USING (true);

CREATE POLICY "Admins can manage classes." ON public.classes FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage subjects." ON public.subjects FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage students." ON public.students FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage schedule." ON public.schedule FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Teacher-specific data (Attendance, Grades, Journal)
CREATE POLICY "Teachers can manage their own data." ON public.attendance FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own data." ON public.grades FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own data." ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own agendas." ON public.agendas FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Student Notes (Wali Kelas and Guru Mapel can access)
CREATE POLICY "Teachers can view notes for their students." ON public.student_notes FOR SELECT USING (
    (SELECT is_homeroom_teacher FROM public.profiles WHERE id = auth.uid()) -- Wali kelas bisa lihat semua
    OR auth.uid() = teacher_id -- Guru mapel yg membuat catatan bisa lihat
);
CREATE POLICY "Teachers can insert notes." ON public.student_notes FOR INSERT WITH CHECK (auth.uid() = teacher_id);


-- This trigger automatically creates a profile for a new user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, role, account_status)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'teacher', -- Default role for new users
    'Pro'      -- Default account status to Pro
  );
  return new;
end;
$$;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN user_role = 'admin';
END;
$$;

-- Function for account activation (though all users are Pro now, kept for structure)
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    p_code text, 
    p_user_id uuid, 
    p_user_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_id uuid;
BEGIN
  -- 1. Find a valid, unused activation code
  SELECT id INTO v_code_id
  FROM activation_codes
  WHERE code = p_code AND is_used = false
  FOR UPDATE; -- Lock row to prevent race condition

  -- 2. If code is not found or already used, raise an exception
  IF v_code_id IS NULL THEN
    RAISE EXCEPTION 'Kode aktivasi tidak valid atau sudah digunakan.';
  END IF;

  -- 3. Mark the activation code as used
  UPDATE activation_codes
  SET 
    is_used = true,
    used_by = p_user_id,
    used_at = now(),
    used_by_email = p_user_email
  WHERE id = v_code_id;

  -- 4. Update the user's profile to 'Pro'
  UPDATE profiles
  SET account_status = 'Pro'
  WHERE id = p_user_id;

  -- 5. Ensure the profile update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil pengguna tidak ditemukan.';
  END IF;

END;
$$;
-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.activate_account_with_code(text, uuid, text) TO authenticated;


-- RPC functions for ledger data
CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE (
    id uuid,
    subjectName text,
    assessment_type text,
    date text,
    score numeric,
    kkm numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        s.name AS subjectName,
        g.assessment_type,
        g.date::text,
        (r.value->>'score')::numeric,
        s.kkm
    FROM
        public.grades g
    JOIN
        public.subjects s ON g.subject_id = s.id,
        jsonb_array_elements(g.records) r
    WHERE
        (r.value->>'student_id')::uuid = p_student_id
    ORDER BY
        g.date DESC, s.name;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_student_grades_ledger(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_student_attendance_ledger(p_student_id uuid)
RETURNS TABLE (
    id uuid,
    subjectName text,
    date text,
    meeting_number int,
    status text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        s.name AS subjectName,
        a.date::text,
        a.meeting_number,
        r.value->>'status' AS status
    FROM
        public.attendance a
    JOIN
        public.subjects s ON a.subject_id = s.id,
        jsonb_array_elements(a.records) r
    WHERE
        (r.value->>'student_id')::uuid = p_student_id
    ORDER BY
        a.date DESC, s.name;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_student_attendance_ledger(uuid) TO authenticated;

-- RPC for student performance stats
CREATE OR REPLACE FUNCTION get_student_performance_for_class(p_class_id uuid)
RETURNS TABLE (
    id uuid,
    name text,
    nis text,
    average_grade numeric,
    attendance_percentage numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH student_grades AS (
    SELECT
      (r.value->>'student_id')::uuid AS student_id,
      AVG((r.value->>'score')::numeric) AS avg_grade
    FROM grades, jsonb_array_elements(records) r
    WHERE class_id = p_class_id
    GROUP BY (r.value->>'student_id')::uuid
  ),
  student_attendance AS (
    SELECT
      (r.value->>'student_id')::uuid AS student_id,
      COUNT(*) as total_records,
      SUM(CASE WHEN r.value->>'status' = 'Hadir' THEN 1 ELSE 0 END) as hadir_count
    FROM attendance, jsonb_array_elements(records) r
    WHERE class_id = p_class_id
    GROUP BY (r.value->>'student_id')::uuid
  )
  SELECT
    s.id,
    s.name,
    s.nis,
    COALESCE(ROUND(sg.avg_grade, 2), 0) AS average_grade,
    COALESCE(ROUND((sa.hadir_count * 100.0) / sa.total_records, 2), 0) AS attendance_percentage
  FROM students s
  LEFT JOIN student_grades sg ON s.id = sg.student_id
  LEFT JOIN student_attendance sa ON s.id = sa.student_id
  WHERE s.class_id = p_class_id AND s.status = 'active';
END;
$$;

-- Create a view for easier querying of student_notes with teacher names
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.id,
    sn.student_id,
    sn.teacher_id,
    sn.note,
    sn.type,
    sn.date,
    p.full_name AS teacher_name
FROM 
    public.student_notes sn
JOIN 
    public.profiles p ON sn.teacher_id = p.id;

-- Create views for easier querying of attendance and grades history
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
    a.id,
    a.date,
    a.class_id,
    a.subject_id,
    a.school_year_id,
    a.teacher_id,
    a.meeting_number,
    a.records,
    c.name as className,
    s.name as subjectName,
    EXTRACT(MONTH FROM a.date) as month
FROM 
    public.attendance a
JOIN 
    public.classes c ON a.class_id = c.id
JOIN
    public.subjects s ON a.subject_id = s.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    g.id,
    g.date,
    g.class_id,
    g.subject_id,
    g.school_year_id,
    g.teacher_id,
    g.assessment_type,
    g.records,
    c.name as className,
    s.name as subjectName,
    s.kkm as subjectKkm,
    EXTRACT(MONTH FROM g.date) as month
FROM 
    public.grades g
JOIN 
    public.classes c ON g.class_id = c.id
JOIN
    public.subjects s ON g.subject_id = s.id;

-- Create view for teacher attendance history with teacher names
CREATE OR REPLACE VIEW public.teacher_attendance_history AS
SELECT 
    ta.id,
    ta.teacher_id as "teacherId",
    p.full_name as "teacherName",
    ta.date,
    ta.check_in as "checkIn",
    ta.check_out as "checkOut",
    ta.status
FROM 
    public.teacher_attendance ta
JOIN 
    public.profiles p ON ta.teacher_id = p.id;
    
-- Create view for journal entries with class and subject names
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT
    j.id,
    j.date,
    j.class_id,
    j.subject_id,
    j.school_year_id,
    j.meeting_number,
    j.learning_objectives,
    j.learning_activities,
    j.assessment,
    j.reflection,
    j.teacher_id,
    c.name as className,
    s.name as subjectName,
    EXTRACT(MONTH FROM j.date) as month
FROM
    public.journal_entries j
JOIN
    public.classes c ON j.class_id = c.id
JOIN
    public.subjects s ON j.subject_id = s.id;

-- Add foreign key from profiles to auth.users
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- Add foreign key from classes to profiles (for homeroom teacher)
ALTER TABLE public.classes
  ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles (id) ON DELETE SET NULL;

-- Add foreign keys to students table
ALTER TABLE public.students
  ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON DELETE RESTRICT;

-- Add foreign keys to attendance table
ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON DELETE CASCADE,
  ADD CONSTRAINT attendance_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects (id) ON DELETE CASCADE,
  ADD CONSTRAINT attendance_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  ADD CONSTRAINT attendance_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;
  
-- Add foreign keys to grades table
ALTER TABLE public.grades
  ADD CONSTRAINT grades_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON DELETE CASCADE,
  ADD CONSTRAINT grades_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects (id) ON DELETE CASCADE,
  ADD CONSTRAINT grades_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  ADD CONSTRAINT grades_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;

-- Add foreign keys to journal_entries table
ALTER TABLE public.journal_entries
  ADD CONSTRAINT journal_entries_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON DELETE CASCADE,
  ADD CONSTRAINT journal_entries_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects (id) ON DELETE CASCADE,
  ADD CONSTRAINT journal_entries_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  ADD CONSTRAINT journal_entries_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;
  
-- Add foreign keys to schedule table
ALTER TABLE public.schedule
  ADD CONSTRAINT schedule_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON DELETE CASCADE,
  ADD CONSTRAINT schedule_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects (id) ON DELETE CASCADE,
  ADD CONSTRAINT schedule_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

-- Add foreign keys to student_notes table
ALTER TABLE public.student_notes
  ADD CONSTRAINT student_notes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students (id) ON DELETE CASCADE,
  ADD CONSTRAINT student_notes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
  
-- Add foreign key to agendas table
ALTER TABLE public.agendas
    ADD CONSTRAINT agendas_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key to teacher_attendance table
ALTER TABLE public.teacher_attendance
    ADD CONSTRAINT teacher_attendance_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key to activation_codes table
ALTER TABLE public.activation_codes
    ADD CONSTRAINT activation_codes_used_by_fkey FOREIGN KEY (used_by) REFERENCES auth.users(id) ON DELETE SET NULL;
