-- Initial Schema for Lakukelas App

-- Enable RLS
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;

-- Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  full_name text not null,
  avatar_url text,
  nip text,
  pangkat text,
  jabatan text,
  school_name text,
  school_address text,
  headmaster_name text,
  headmaster_nip text,
  school_logo_url text,
  account_status text not null default 'Free',
  role text not null default 'teacher',
  email text,
  active_school_year_id uuid references public.school_years(id) on delete set null
);
alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- Activation Codes Table
create table if not exists public.activation_codes (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    is_used boolean not null default false,
    used_by uuid references public.profiles(id) on delete set null,
    used_at timestamp with time zone,
    created_at timestamp with time zone not null default now()
);
alter table public.activation_codes enable row level security;
create policy "Admins can manage activation codes" on public.activation_codes for all using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
create policy "Authenticated users can view codes" on public.activation_codes for select using ( auth.role() = 'authenticated' );

-- Classes Table
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references public.profiles(id) on delete cascade
);
alter table public.classes enable row level security;
create policy "Teachers can manage their own classes" on public.classes for all using (auth.uid() = teacher_id);

-- Subjects Table
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm integer not null default 75,
  teacher_id uuid not null references public.profiles(id) on delete cascade
);
alter table public.subjects enable row level security;
create policy "Teachers can manage their own subjects" on public.subjects for all using (auth.uid() = teacher_id);

-- School Years Table
create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  unique(teacher_id, name)
);
alter table public.school_years enable row level security;
create policy "Teachers can manage their own school years" on public.school_years for all using (auth.uid() = teacher_id);

-- Students Table
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text not null,
  gender text not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  status text not null default 'active' -- 'active' or 'graduated'
);
alter table public.students enable row level security;
-- Adding a UNIQUE constraint for nis per teacher
create unique index unique_nis_per_teacher on public.students (nis, (select teacher_id from classes where id = class_id));
create policy "Teachers can view their own students" on public.students for select using (
  auth.uid() = (
    select teacher_id from classes where id = students.class_id
  )
);
create policy "Teachers can insert students into their own classes" on public.students for insert with check (
  auth.uid() = (
    select teacher_id from classes where id = students.class_id
  )
);
create policy "Teachers can update their own students" on public.students for update using (
  auth.uid() = (
    select teacher_id from classes where id = students.class_id
  )
);

-- Attendance History Table
create table if not exists public.attendance_history (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  meeting_number integer,
  records jsonb,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  unique(date, class_id, subject_id, meeting_number)
);
alter table public.attendance_history enable row level security;
create policy "Teachers can manage their own attendance history" on public.attendance_history for all using (auth.uid() = teacher_id);

-- Grade History Table
create table if not exists public.grade_history (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  assessment_type text not null,
  records jsonb,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  unique(class_id, subject_id, assessment_type)
);
alter table public.grade_history enable row level security;
create policy "Teachers can manage their own grade history" on public.grade_history for all using (auth.uid() = teacher_id);

-- Schedule Table
create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  start_time time not null,
  end_time time not null,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade
);
alter table public.schedule enable row level security;
create policy "Teachers can manage their own schedule" on public.schedule for all using (auth.uid() = teacher_id);

-- Journal Table
create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  meeting_number integer,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone not null default now()
);
alter table public.journals enable row level security;
create policy "Teachers can manage their own journals" on public.journals for all using (auth.uid() = teacher_id);

-- Agenda Table
create table if not exists public.agendas (
    id uuid primary key default gen_random_uuid(),
    date date not null,
    title text not null,
    description text,
    tag text,
    color text,
    start_time time,
    end_time time,
    teacher_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamp with time zone not null default now()
);
alter table public.agendas enable row level security;
create policy "Teachers can manage their own agendas" on public.agendas for all using (auth.uid() = teacher_id);


-- Database Functions
-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call handle_new_user on new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to handle user deletion
create or replace function public.handle_user_delete()
returns trigger as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$ language plpgsql security definer;

-- Trigger to call handle_user_delete when a user is deleted
drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  before delete on auth.users
  for each row execute procedure public.handle_user_delete();

-- Function to activate account
create or replace function public.activate_account_with_code(
    activation_code_to_use text,
    user_id_to_activate uuid,
    user_email_to_set text
)
returns void as $$
declare
    code_id uuid;
    code_is_used boolean;
begin
    -- Check if the code exists and is not used
    select id, is_used into code_id, code_is_used
    from public.activation_codes
    where code = activation_code_to_use;

    if code_id is null then
        raise exception 'Code not found';
    end if;

    if code_is_used is true then
        raise exception 'Code already used';
    end if;

    -- Update profile
    update public.profiles
    set account_status = 'Pro'
    where id = user_id_to_activate;

    -- Update activation code
    update public.activation_codes
    set is_used = true,
        used_by = user_id_to_activate,
        used_at = now()
    where id = code_id;

end;
$$ language plpgsql;

-- Function to add student with teacher check
CREATE OR REPLACE FUNCTION add_student_with_teacher_check(
    p_class_id UUID,
    p_nis TEXT,
    p_name TEXT,
    p_gender TEXT
) RETURNS VOID AS $$
DECLARE
    v_teacher_id UUID;
    v_nis_exists_for_teacher BOOLEAN;
BEGIN
    -- Get the teacher_id from the class
    SELECT teacher_id INTO v_teacher_id FROM classes WHERE id = p_class_id;

    -- Check if the NIS already exists for any student of this teacher
    SELECT EXISTS (
        SELECT 1
        FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE s.nis = p_nis AND c.teacher_id = v_teacher_id
    ) INTO v_nis_exists_for_teacher;

    -- If it exists, raise an exception
    IF v_nis_exists_for_teacher THEN
        RAISE EXCEPTION 'NIS already exists for this teacher';
    END IF;

    -- If not, insert the new student
    INSERT INTO students(class_id, nis, name, gender)
    VALUES (p_class_id, p_nis, p_name, p_gender);
END;
$$ LANGUAGE plpgsql;

-- Database Views and Functions for Reports
-- Hapus VIEW yang lama jika ada
DROP VIEW IF EXISTS public.v_attendance_history;
DROP VIEW IF EXISTS public.v_grade_history;

-- Buat fungsi database yang baru dan cerdas untuk mengambil data laporan
create
or replace function get_report_data (
  p_teacher_id uuid,
  p_school_year_id uuid default null,
  p_month int default null
) returns table (
  summary_cards jsonb,
  student_performance jsonb,
  attendance_by_class jsonb,
  overall_attendance_distribution jsonb,
  journal_entries jsonb,
  attendance_history jsonb,
  grade_history jsonb,
  all_students jsonb
) as $$
declare
  active_school_year_id uuid;
begin
  -- Determine the active school year if not provided
  if p_school_year_id is null then
    select p.active_school_year_id into active_school_year_id from profiles p where p.id = p_teacher_id;
  else
    active_school_year_id := p_school_year_id;
  end if;

  return query
  with
  -- Raw history data filtered by teacher and optionally by school year/month
  filtered_attendance as (
    select * from public.attendance_history
    where teacher_id = p_teacher_id
    and (active_school_year_id is null or school_year_id = active_school_year_id)
    and (p_month is null or extract(month from date) = p_month)
  ),
  filtered_grades as (
    select * from public.grade_history
    where teacher_id = p_teacher_id
    and (active_school_year_id is null or school_year_id = active_school_year_id)
    and (p_month is null or extract(month from date) = p_month)
  ),
  filtered_journals as (
     select * from public.journals
    where teacher_id = p_teacher_id
    and (active_school_year_id is null or school_year_id = active_school_year_id)
    and (p_month is null or extract(month from date) = p_month)
  ),
  teacher_students as (
    select s.id, s.name, s.class_id, c.name as class_name
    from public.students s
    join public.classes c on s.class_id = c.id
    where c.teacher_id = p_teacher_id and s.status = 'active'
  )

  select
    -- 1. Summary Cards
    coalesce((select jsonb_build_object(
      'overallAttendanceRate', (select coalesce(
          (sum(case when (r->>'status') = 'Hadir' then 1 else 0 end)::decimal / nullif(count(*), 0)) * 100, 0)
          from filtered_attendance, jsonb_to_recordset(records) as r(student_id uuid, status text)
      ),
      'overallAverageGrade', (select coalesce(avg((r->>'score')::numeric), 0)
          from filtered_grades, jsonb_to_recordset(records) as r(student_id uuid, score text)
      ),
      'totalJournals', (select count(*) from filtered_journals)
    )), '{}'::jsonb) as summary_cards,

    -- 2. Student Performance
    coalesce((select jsonb_agg(sp) from (
        select
            s.id,
            s.name,
            s.class_name,
            coalesce(avg((gr.r->>'score')::numeric), 0) as average_grade,
            coalesce(
                (sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100,
            100) as attendance_percentage,
            case
                when coalesce(avg((gr.r->>'score')::numeric), 0) >= 85 and coalesce((sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100, 100) >= 90 then 'Sangat Baik'
                when coalesce(avg((gr.r->>'score')::numeric), 0) >= 75 and coalesce((sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100, 100) >= 80 then 'Stabil'
                when coalesce(avg((gr.r->>'score')::numeric), 0) < 75 and coalesce((sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100, 100) < 80 then 'Berisiko'
                else 'Butuh Perhatian'
            end as status
        from teacher_students s
        left join filtered_attendance fa on true
        left join jsonb_to_recordset(fa.records) as ar(r) on (ar.r->>'student_id')::uuid = s.id
        left join filtered_grades fg on true
        left join jsonb_to_recordset(fg.records) as gr(r) on (gr.r->>'student_id')::uuid = s.id
        group by s.id, s.name, s.class_name
        order by average_grade desc
    ) sp), '[]'::jsonb) as student_performance,

    -- 3. Attendance by Class
    coalesce((select jsonb_agg(abc) from (
        select
            c.name as class_name,
            jsonb_agg(jsonb_build_object('status', r.status, 'count', count(r.status))) as distribution
        from filtered_attendance fa
        join public.classes c on fa.class_id = c.id,
        jsonb_to_recordset(fa.records) as r(status text)
        group by c.name
    ) abc), '[]'::jsonb) as attendance_by_class,

    -- 4. Overall Attendance Distribution
    coalesce((select jsonb_object_agg(status, count)
      from (
          select r->>'status' as status, count(*)
          from filtered_attendance, jsonb_array_elements(records) as r
          group by r->>'status'
      ) t
    ), '{}'::jsonb) as overall_attendance_distribution,

    -- 5. Journal Entries
    coalesce((select jsonb_agg(j) from (
        select j.id, j.date, j.class_id, j.subject_id, j.meeting_number, j.learning_objectives, c.name as "className", s.name as "subjectName"
        from filtered_journals j
        join public.classes c on j.class_id = c.id
        join public.subjects s on j.subject_id = s.id
        order by j.date desc
    ) j), '[]'::jsonb) as journal_entries,

    -- 6. Attendance History
    coalesce((select jsonb_agg(ah) from (
      select ah.id, ah.date, ah.class_id, ah.subject_id, ah.meeting_number, ah.records, c.name as "className", s.name as "subjectName"
      from filtered_attendance ah
      join public.classes c on ah.class_id = c.id
      join public.subjects s on ah.subject_id = s.id
      order by ah.date desc
    ) ah), '[]'::jsonb) as attendance_history,

    -- 7. Grade History
    coalesce((select jsonb_agg(gh) from (
      select gh.id, gh.date, gh.class_id, gh.subject_id, gh.assessment_type, gh.records, c.name as "className", s.name as "subjectName"
      from filtered_grades gh
      join public.classes c on gh.class_id = c.id
      join public.subjects s on gh.subject_id = s.id
      order by gh.date desc
    ) gh), '[]'::jsonb) as grade_history,

    -- 8. All students (for the teacher)
    coalesce((select jsonb_agg(s) from teacher_students s), '[]'::jsonb) as all_students;
end;
$$ language plpgsql;
