
-- RLS (Row Level Security) Policies
-- These policies ensure that users can only access and modify their own data.

-- 1. Profiles
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  email text,
  role text default 'teacher',
  nip text,
  pangkat text,
  jabatan text,
  school_name text,
  school_address text,
  headmaster_name text,
  headmaster_nip text,
  school_logo_url text,
  account_status text default 'Free',
  created_at timestamptz default now(),
  active_school_year_id uuid references public.school_years
);
alter table profiles enable row level security;
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);


-- 2. School Years
create table school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references auth.users on delete cascade,
  created_at timestamptz default now()
);
alter table school_years enable row level security;
create policy "Users can manage their own school years" on school_years for all using (auth.uid() = teacher_id);


-- 3. Classes
create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references auth.users on delete cascade,
  created_at timestamptz default now()
);
alter table classes enable row level security;
create policy "Users can manage their own classes" on classes for all using (auth.uid() = teacher_id);


-- 4. Subjects
create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm integer not null default 75,
  teacher_id uuid references auth.users on delete cascade,
  created_at timestamptz default now()
);
alter table subjects enable row level security;
create policy "Users can manage their own subjects" on subjects for all using (auth.uid() = teacher_id);


-- 5. Students
create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text not null,
  gender text not null,
  class_id uuid references classes on delete set null,
  teacher_id uuid references auth.users on delete cascade,
  created_at timestamptz default now(),
  status text not null default 'active'
);
alter table students enable row level security;
create policy "Teachers can view their own students" on students for select using (auth.uid() = teacher_id);
create policy "Teachers can insert students for their classes" on students for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update their own students" on students for update using (auth.uid() = teacher_id);
create policy "Teachers can delete their own students" on students for delete using (auth.uid() = teacher_id);

-- Add unique constraint for nis per teacher
CREATE UNIQUE INDEX unique_nis_per_teacher ON students (teacher_id, nis);

-- 6. Schedule
create table schedule (
    id uuid primary key default gen_random_uuid(),
    day text not null,
    start_time time not null,
    end_time time not null,
    subject_id uuid references subjects on delete cascade,
    class_id uuid references classes on delete cascade,
    teacher_id uuid references auth.users on delete cascade,
    created_at timestamptz default now()
);
alter table schedule enable row level security;
create policy "Users can manage their own schedule" on schedule for all using (auth.uid() = teacher_id);


-- 7. Attendance History
create table attendance_history (
    id uuid primary key default gen_random_uuid(),
    date date not null,
    class_id uuid references classes on delete cascade,
    subject_id uuid references subjects on delete cascade,
    school_year_id uuid references school_years on delete cascade,
    meeting_number integer,
    records jsonb, -- [{ "studentId": "uuid", "status": "Hadir/Sakit/Izin/Alpha" }]
    teacher_id uuid references auth.users on delete cascade,
    created_at timestamptz default now()
);
alter table attendance_history enable row level security;
create policy "Users can manage their own attendance history" on attendance_history for all using (auth.uid() = teacher_id);


-- 8. Grade History
create table grade_history (
    id uuid primary key default gen_random_uuid(),
    date date not null,
    class_id uuid references classes on delete cascade,
    subject_id uuid references subjects on delete cascade,
    school_year_id uuid references school_years on delete cascade,
    assessment_type text not null,
    records jsonb, -- [{ "studentId": "uuid", "score": 100 }]
    teacher_id uuid references auth.users on delete cascade,
    created_at timestamptz default now()
);
alter table grade_history enable row level security;
create policy "Users can manage their own grade history" on grade_history for all using (auth.uid() = teacher_id);


-- 9. Journals
create table journals (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  class_id uuid references classes on delete cascade,
  subject_id uuid references subjects on delete cascade,
  school_year_id uuid references school_years on delete cascade,
  meeting_number integer,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  teacher_id uuid references auth.users on delete cascade,
  created_at timestamptz default now()
);
alter table journals enable row level security;
create policy "Users can manage their own journals" on journals for all using (auth.uid() = teacher_id);

-- 10. Agendas
create table agendas (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text not null,
  description text,
  tag text,
  color text,
  start_time time,
  end_time time,
  teacher_id uuid references auth.users on delete cascade,
  created_at timestamptz default now()
);
alter table agendas enable row level security;
create policy "Users can manage their own agendas" on agendas for all using (auth.uid() = teacher_id);


-- 11. Activation Codes
create table activation_codes (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    is_used boolean default false,
    used_by uuid references profiles(id),
    used_at timestamptz,
    created_at timestamptz default now()
);
-- This table should only be accessible by service_role, so no RLS policies for users.


-- Helper function to automatically create a profile for a new user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email, role, account_status)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.email,
    'teacher',
    'Free'
  );
  return new;
end;
$$;

-- Trigger to execute the function when a new user signs up.
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Helper function to handle deleting a user's public profile when their auth entry is deleted.
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();


-- Function to add a student, ensuring the NIS is unique for that teacher.
CREATE OR REPLACE FUNCTION add_student_with_teacher_check(
    p_class_id UUID,
    p_nis TEXT,
    p_name TEXT,
    p_gender TEXT
)
RETURNS VOID AS $$
DECLARE
    v_teacher_id UUID;
BEGIN
    -- Get the teacher_id from the provided class_id
    SELECT teacher_id INTO v_teacher_id FROM public.classes WHERE id = p_class_id;

    -- If the teacher_id is null (class not found), raise an exception
    IF v_teacher_id IS NULL THEN
        RAISE EXCEPTION 'Class not found';
    END IF;

    -- Insert the new student with the retrieved teacher_id
    INSERT INTO public.students (name, nis, gender, class_id, teacher_id, status)
    VALUES (p_name, p_nis, p_gender, p_class_id, v_teacher_id, 'active');
END;
$$ LANGUAGE plpgsql;


-- Function to activate a user's account and mark the code as used in a single transaction.
create or replace function activate_account_with_code(
    activation_code_to_use text,
    user_id_to_activate uuid,
    user_email_to_set text
)
returns void
language plpgsql
as $$
declare
  code_id uuid;
  is_code_used boolean;
begin
  -- Check if the code exists and is not used, and lock the row for update
  select id, is_used into code_id, is_code_used
  from public.activation_codes
  where code = activation_code_to_use
  for update;

  -- If code is not found or already used, raise an error
  if code_id is null then
    raise exception 'Code not found';
  end if;

  if is_code_used then
    raise exception 'Code already used';
  end if;

  -- Update the user's profile to 'Pro'
  update public.profiles
  set account_status = 'Pro'
  where id = user_id_to_activate;

  -- Mark the code as used
  update public.activation_codes
  set
    is_used = true,
    used_by = user_id_to_activate,
    used_at = now()
  where id = code_id;
end;
$$;


-- Database Views for Reporting
CREATE OR REPLACE VIEW public.v_attendance_history AS
SELECT
  ah.id,
  ah.teacher_id,
  ah.date,
  ah.class_id,
  ah.subject_id,
  ah.school_year_id,
  ah.meeting_number,
  ah.records,
  c.name as class_name,
  s.name as subject_name,
  (SELECT json_object_agg(st.id, st.name) FROM jsonb_to_recordset(ah.records) AS r(student_id uuid, status text) JOIN students st ON st.id = r.student_id) as student_names,
  EXTRACT(MONTH FROM ah.date) as month
FROM
  attendance_history ah
JOIN
  classes c ON ah.class_id = c.id
JOIN
  subjects s ON ah.subject_id = s.id;


CREATE OR REPLACE VIEW public.v_grade_history AS
SELECT
  gh.id,
  gh.teacher_id,
  gh.date,
  gh.class_id,
  gh.subject_id,
  gh.school_year_id,
  gh.assessment_type,
  gh.records,
  c.name as class_name,
  s.name as subject_name,
  s.kkm as subject_kkm,
  (SELECT json_object_agg(st.id, st.name) FROM jsonb_to_recordset(gh.records) AS r(student_id uuid, score numeric) JOIN students st ON st.id = r.student_id) as student_names,
  EXTRACT(MONTH FROM gh.date) as month
FROM
  grade_history gh
JOIN
  classes c ON gh.class_id = c.id
JOIN
  subjects s ON gh.subject_id = s.id;
