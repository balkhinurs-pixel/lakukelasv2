
-- Enable RLS
alter default privileges in schema public grant select on tables to authenticated;
alter default privileges in schema public grant insert on tables to authenticated;
alter default privileges in schema public grant update on tables to authenticated;
alter default privileges in schema public grant delete on tables to authenticated;

-- Create user profiles table
create table profiles (
  id uuid references auth.users not null primary key,
  created_at timestamptz not null default now(),
  full_name text not null,
  avatar_url text,
  email text,
  nip text,
  pangkat text,
  jabatan text,
  school_name text,
  school_address text,
  headmaster_name text,
  headmaster_nip text,
  school_logo_url text,
  role text not null default 'teacher',
  account_status text not null default 'Free',
  active_school_year_id uuid references public.school_years(id) on delete set null
);
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Create classes table
create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  unique(name, teacher_id)
);
alter table classes enable row level security;
create policy "Classes are viewable by the user who created them." on classes for select using (auth.uid() = teacher_id);
create policy "Users can insert their own classes." on classes for insert with check (auth.uid() = teacher_id);

-- Create subjects table
create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm integer not null default 75,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  unique(name, teacher_id)
);
alter table subjects enable row level security;
create policy "Subjects are viewable by the user who created them." on subjects for select using (auth.uid() = teacher_id);
create policy "Users can insert their own subjects." on subjects for insert with check (auth.uid() = teacher_id);

-- Create school_years table
create table school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  unique(name, teacher_id)
);
alter table school_years enable row level security;
create policy "School years are viewable by the user who created them." on school_years for select using (auth.uid() = teacher_id);
create policy "Users can insert their own school years." on school_years for insert with check (auth.uid() = teacher_id);

-- Create students table
create type gender as enum ('Laki-laki', 'Perempuan');
create type student_status as enum ('active', 'graduated', 'dropout', 'inactive');
create table students (
  id uuid primary key default gen_random_uuid(),
  nis text not null,
  name text not null,
  gender gender not null,
  class_id uuid references public.classes(id) on delete set null not null,
  status student_status not null default 'active',
  unique(nis, class_id)
);
alter table students enable row level security;
create policy "Students are viewable by the teacher of their class." on students for select using (
  exists (
    select 1 from classes
    where classes.id = students.class_id and classes.teacher_id = auth.uid()
  )
);
create policy "Teachers can insert students into their own classes." on students for insert with check (
  exists (
    select 1 from classes
    where classes.id = students.class_id and classes.teacher_id = auth.uid()
  )
);
create policy "Teachers can update students in their own classes." on students for update using (
  exists (
    select 1 from classes
    where classes.id = students.class_id and classes.teacher_id = auth.uid()
  )
);

-- Create schedule table
create type day_of_week as enum ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu');
create table schedule (
    id uuid primary key default gen_random_uuid(),
    day day_of_week not null,
    start_time time not null,
    end_time time not null,
    subject_id uuid references public.subjects(id) on delete cascade not null,
    class_id uuid references public.classes(id) on delete cascade not null,
    teacher_id uuid references public.profiles(id) on delete cascade not null,
    unique(day, start_time, teacher_id)
);
alter table schedule enable row level security;
create policy "Schedules are viewable by the user who created them." on schedule for select using (auth.uid() = teacher_id);
create policy "Users can manage their own schedules." on schedule for all with check (auth.uid() = teacher_id);

-- Create attendance history table
create type attendance_status as enum ('Hadir', 'Sakit', 'Izin', 'Alpha');
create table attendance_history (
    id uuid primary key default gen_random_uuid(),
    date date not null,
    class_id uuid references public.classes(id) on delete cascade not null,
    subject_id uuid references public.subjects(id) on delete cascade not null,
    school_year_id uuid references public.school_years(id) on delete set null,
    meeting_number integer not null,
    records jsonb not null, -- [{ "student_id": "uuid", "status": "Hadir" }]
    teacher_id uuid references public.profiles(id) on delete cascade not null
);
alter table attendance_history enable row level security;
create policy "Attendance history is manageable by the user who created it." on attendance_history for all using (auth.uid() = teacher_id);

-- Create grade history table
create table grade_history (
    id uuid primary key default gen_random_uuid(),
    date date not null,
    class_id uuid references public.classes(id) on delete cascade not null,
    subject_id uuid references public.subjects(id) on delete cascade not null,
    school_year_id uuid references public.school_years(id) on delete set null,
    assessment_type text not null,
    records jsonb not null, -- [{ "student_id": "uuid", "score": 95 }]
    teacher_id uuid references public.profiles(id) on delete cascade not null
);
alter table grade_history enable row level security;
create policy "Grade history is manageable by the user who created it." on grade_history for all using (auth.uid() = teacher_id);

-- Create journals table
create table journals (
    id uuid primary key default gen_random_uuid(),
    date date not null,
    class_id uuid references public.classes(id) on delete cascade not null,
    subject_id uuid references public.subjects(id) on delete cascade not null,
    school_year_id uuid references public.school_years(id) on delete set null,
    meeting_number integer,
    learning_objectives text not null,
    learning_activities text not null,
    assessment text,
    reflection text,
    teacher_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamptz not null default now()
);
alter table journals enable row level security;
create policy "Journals are manageable by the user who created them." on journals for all using (auth.uid() = teacher_id);


-- Create agendas table
create table agendas (
    id uuid primary key default gen_random_uuid(),
    date date not null,
    title text not null,
    description text,
    tag text,
    color text,
    start_time time,
    end_time time,
    teacher_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamptz not null default now()
);
alter table agendas enable row level security;
create policy "Agendas are manageable by the user who created them." on agendas for all using (auth.uid() = teacher_id);


-- Create activation codes table
create table activation_codes (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    is_used boolean not null default false,
    used_by uuid references public.profiles(id),
    used_at timestamptz,
    created_at timestamptz not null default now()
);
-- RLS for activation_codes should be handled by server-side logic (or functions)
-- For now, we will allow admin role to manage it.
alter table activation_codes enable row level security;
create policy "Admins can manage activation codes." on activation_codes for all using (
  exists (
    select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
create policy "Users can view their own used code." on activation_codes for select using (auth.uid() = used_by);


-- Set up Realtime!
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table profiles, classes, subjects, students, schedule, attendance_history, grade_history, journals, activation_codes;

-- Function to handle new user signup
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    'teacher'
  );
  return new;
end;
$$;

-- Trigger to call the function on new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Function to automatically delete profile when a user is deleted
CREATE OR REPLACE FUNCTION public.on_delete_user()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user deletion
CREATE TRIGGER after_user_delete
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.on_delete_user();


-- Function for account activation
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    activation_code_to_use TEXT,
    user_id_to_activate UUID,
    user_email_to_set TEXT
)
RETURNS VOID AS $$
DECLARE
    code_id UUID;
    is_code_used BOOLEAN;
BEGIN
    -- Check if the code exists and is not used
    SELECT id, is_used INTO code_id, is_code_used
    FROM public.activation_codes
    WHERE code = activation_code_to_use;

    IF code_id IS NULL THEN
        RAISE EXCEPTION 'Code not found';
    END IF;

    IF is_code_used THEN
        RAISE EXCEPTION 'Code already used';
    END IF;

    -- Update the profiles table
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;

    -- Update the activation_codes table
    UPDATE public.activation_codes
    SET is_used = TRUE,
        used_by = user_id_to_activate,
        used_at = NOW()
    WHERE id = code_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.activate_account_with_code(TEXT, UUID, TEXT) TO authenticated;


-- Function to add a student, but only if the NIS doesn't already exist for that teacher
CREATE OR REPLACE FUNCTION public.add_student_with_teacher_check(p_class_id uuid, p_nis text, p_name text, p_gender text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_teacher_id UUID;
BEGIN
    -- Get the teacher_id associated with the provided p_class_id
    SELECT teacher_id INTO v_teacher_id
    FROM public.classes
    WHERE id = p_class_id;

    -- Check if a student with the same NIS already exists for this teacher across all their classes
    IF EXISTS (
        SELECT 1
        FROM public.students s
        JOIN public.classes c ON s.class_id = c.id
        WHERE s.nis = p_nis AND c.teacher_id = v_teacher_id
    ) THEN
        RAISE EXCEPTION 'NIS already exists for this teacher';
    END IF;

    -- If no duplicate is found, insert the new student
    INSERT INTO public.students (class_id, nis, name, gender, status)
    VALUES (p_class_id, p_nis, p_name, p_gender::gender, 'active');
END;
$function$;
grant execute on function public.add_student_with_teacher_check(uuid, text, text, text) to authenticated;
