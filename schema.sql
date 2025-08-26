
-- Drop existing tables and types to start fresh (optional, for clean installs)
-- Note: In a real migration, you would handle data migration carefully.
-- For a fresh schema, it's fine to drop and recreate.
DROP VIEW IF EXISTS public.grades_history CASCADE;
DROP VIEW IF EXISTS public.attendance_history CASCADE;
DROP TABLE IF EXISTS public.grades CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.grade_records CASCADE;
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.journal_entries CASCADE;
DROP TABLE IF EXISTS public.agendas CASCADE;
DROP TABLE IF EXISTS public.schedule CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.school_years CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.teacher_attendance CASCADE;
DROP TABLE IF EXISTS public.activation_codes CASCADE;
DROP TABLE IF EXISTS public.student_notes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Custom Types
-- Note: Using simple types is often better. These are kept for reference.

-- Tables
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    full_name text,
    avatar_url text,
    nip text,
    pangkat text,
    jabatan text,
    school_name text,
    school_address text,
    headmaster_name text,
    headmaster_nip text,
    school_logo_url text,
    role text DEFAULT 'teacher'::text,
    email text,
    active_school_year_id uuid,
    is_homeroom_teacher boolean DEFAULT false
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);


CREATE TABLE public.school_years (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    is_active boolean NOT NULL DEFAULT false
);
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School years are viewable by authenticated users." ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage school years." ON public.school_years FOR ALL USING (auth.uid() IN ( SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'::text));


CREATE TABLE public.classes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Classes are viewable by authenticated users." ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage classes." ON public.classes FOR ALL USING (auth.uid() IN ( SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'::text));


CREATE TABLE public.subjects (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    kkm integer NOT NULL DEFAULT 75
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects are viewable by authenticated users." ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage subjects." ON public.subjects FOR ALL USING (auth.uid() IN ( SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'::text));


CREATE TABLE public.students (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    nis text NOT NULL UNIQUE,
    gender text NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id),
    status text NOT NULL DEFAULT 'active'::text,
    avatar_url text
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students are viewable by authenticated users." ON public.students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage students." ON public.students FOR ALL USING (auth.uid() IN ( SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'::text));


CREATE TABLE public.schedule (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schedules are viewable by authenticated users." ON public.schedule FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage schedules." ON public.schedule FOR ALL USING (auth.uid() IN ( SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'::text));
CREATE POLICY "Teachers can view their own schedule." ON public.schedule FOR SELECT USING (auth.uid() = teacher_id);


CREATE TABLE public.journal_entries (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id),
    subject_id uuid NOT NULL REFERENCES public.subjects(id),
    school_year_id uuid REFERENCES public.school_years(id),
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id)
);
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own journal entries." ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);

CREATE TABLE public.agendas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time without time zone,
    end_time time without time zone,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own agendas." ON public.agendas FOR ALL USING (auth.uid() = teacher_id);

-- New Normalized Tables
CREATE TABLE public.grade_records (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id),
    subject_id uuid NOT NULL REFERENCES public.subjects(id),
    class_id uuid NOT NULL REFERENCES public.classes(id),
    date date NOT NULL,
    assessment_type text NOT NULL,
    score numeric(5, 2) NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id),
    school_year_id uuid REFERENCES public.school_years(id)
);
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage grades they submitted." ON public.grade_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Homeroom teachers can view grades of their students." ON public.grade_records FOR SELECT USING (
    (EXISTS ( SELECT 1 FROM classes WHERE (classes.id = grade_records.class_id) AND (classes.teacher_id = auth.uid()))) OR (auth.uid() = teacher_id)
);


CREATE TABLE public.attendance_records (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id),
    subject_id uuid NOT NULL REFERENCES public.subjects(id),
    class_id uuid NOT NULL REFERENCES public.classes(id),
    date date NOT NULL,
    meeting_number integer NOT NULL,
    status text NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id),
    school_year_id uuid REFERENCES public.school_years(id)
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage attendance they submitted." ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Homeroom teachers can view attendance of their students." ON public.attendance_records FOR SELECT USING (
    (EXISTS ( SELECT 1 FROM classes WHERE (classes.id = attendance_records.class_id) AND (classes.teacher_id = auth.uid()))) OR (auth.uid() = teacher_id)
);

CREATE TABLE public.student_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id),
    teacher_id uuid NOT NULL REFERENCES public.profiles(id),
    date timestamp with time zone NOT NULL DEFAULT now(),
    note text NOT NULL,
    type text DEFAULT 'neutral'::text -- positive, improvement, neutral
);
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage notes for students in classes they teach." ON public.student_notes FOR ALL USING (
    (EXISTS ( SELECT 1 FROM schedule WHERE (schedule.teacher_id = auth.uid()) AND (schedule.class_id = ( SELECT students.class_id FROM students WHERE students.id = student_notes.student_id)))) OR 
    (EXISTS ( SELECT 1 FROM classes WHERE (classes.id = ( SELECT students.class_id FROM students WHERE students.id = student_notes.student_id)) AND (classes.teacher_id = auth.uid())))
);

-- Activation and Settings Tables
CREATE TABLE public.activation_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    is_used boolean DEFAULT false,
    used_by uuid,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    used_by_email text
);
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage activation codes." ON public.activation_codes FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE TABLE public.settings (
    key text NOT NULL PRIMARY KEY,
    value text
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage settings." ON public.settings FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "Authenticated users can view settings." ON public.settings FOR SELECT USING (auth.role() = 'authenticated');


CREATE TABLE public.teacher_attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id),
    date date NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    status text,
    UNIQUE(teacher_id, date)
);
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own attendance." ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can view all teacher attendance." ON public.teacher_attendance FOR SELECT USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Views for simplified data fetching
CREATE OR REPLACE VIEW public.grades_history AS
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
JOIN classes c ON g.class_id = c.id
JOIN subjects s ON g.subject_id = s.id
JOIN profiles p ON g.teacher_id = p.id;

CREATE OR REPLACE VIEW public.attendance_history AS
SELECT
    a.id,
    a.date,
    a.meeting_number,
    a.class_id,
    a.subject_id,
    a.teacher_id,
    a.school_year_id,
    a.status,
    a.student_id,
    c.name AS class_name,
    s.name AS subject_name,
    p.full_name AS teacher_name
FROM
    attendance_records a
JOIN classes c ON a.class_id = c.id
JOIN subjects s ON a.subject_id = s.id
JOIN profiles p ON a.teacher_id = p.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    n.id,
    n.student_id,
    n.teacher_id,
    n.date,
    n.note,
    n.type,
    p.full_name as teacher_name
FROM 
    student_notes n
JOIN
    profiles p ON n.teacher_id = p.id;


-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    'teacher' -- default role
  );
  RETURN new;
END;
$$;
-- Trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.get_active_school_year_id()
RETURNS uuid
LANGUAGE sql
AS $$
  SELECT value::uuid FROM public.settings WHERE key = 'active_school_year_id' LIMIT 1;
$$;

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow individual insert access" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow individual update access" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Indexes for performance
CREATE INDEX idx_grade_records_student_id ON public.grade_records(student_id);
CREATE INDEX idx_grade_records_subject_id ON public.grade_records(subject_id);
CREATE INDEX idx_grade_records_school_year_id ON public.grade_records(school_year_id);

CREATE INDEX idx_attendance_records_student_id ON public.attendance_records(student_id);
CREATE INDEX idx_attendance_records_subject_id ON public.attendance_records(subject_id);
CREATE INDEX idx_attendance_records_school_year_id ON public.attendance_records(school_year_id);

CREATE INDEX idx_schedule_teacher_id ON public.schedule(teacher_id);
CREATE INDEX idx_students_class_id ON public.students(class_id);
CREATE INDEX idx_journal_entries_teacher_id ON public.journal_entries(teacher_id);
CREATE INDEX idx_teacher_attendance_teacher_id_date ON public.teacher_attendance(teacher_id, date);
