-- Users table
create table profiles (
  id uuid not null primary key,
  created_at timestamp with time zone default now(),
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
  account_status text not null default 'Free', -- 'Free' or 'Pro'
  role text not null default 'teacher', -- 'teacher' or 'admin'
  email text unique,
  active_school_year_id uuid references public.school_years(id) on delete set null
);

-- Activation codes table
create table activation_codes (
  id uuid not null primary key default gen_random_uuid(),
  code text not null unique,
  is_used boolean not null default false,
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Classes table
create table classes (
  id uuid not null primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references public.profiles(id) on delete cascade
);

-- Subjects table
create table subjects (
  id uuid not null primary key default gen_random_uuid(),
  name text not null,
  kkm integer not null default 75,
  teacher_id uuid not null references public.profiles(id) on delete cascade
);

-- School Years table
create table school_years (
  id uuid not null primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references public.profiles(id) on delete cascade
);

-- Students table
create table students (
  id uuid not null primary key default gen_random_uuid(),
  name text not null,
  nis text not null,
  gender text not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  status text not null default 'active', -- 'active' or 'graduated'
  -- unique constraint for a teacher's students' nis
  constraint unique_teacher_student_nis unique (nis, class_id)
);

-- Schedule table
create table schedule (
  id uuid not null primary key default gen_random_uuid(),
  day text not null,
  start_time time not null,
  end_time time not null,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade
);

-- Attendance History table
create table attendance_history (
    id uuid not null primary key default gen_random_uuid(),
    date date not null,
    class_id uuid not null references public.classes(id) on delete cascade,
    subject_id uuid not null references public.subjects(id) on delete cascade,
    school_year_id uuid references public.school_years(id) on delete set null,
    meeting_number integer,
    records jsonb, -- [{ "student_id": "uuid", "status": "Hadir" | "Sakit" | "Izin" | "Alpha" }]
    teacher_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamp with time zone default now(),
    -- make sure each entry is unique for a given day, class, subject and meeting number
    unique (date, class_id, subject_id, meeting_number)
);

-- Grade History table
create table grade_history (
    id uuid not null primary key default gen_random_uuid(),
    date date not null,
    class_id uuid not null references public.classes(id) on delete cascade,
    subject_id uuid not null references public.subjects(id) on delete cascade,
    school_year_id uuid references public.school_years(id) on delete set null,
    assessment_type text not null,
    records jsonb, -- [{ "student_id": "uuid", "score": number }]
    teacher_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(date, class_id, subject_id, assessment_type)
);

-- Teaching Journal table
create table journals (
    id uuid not null primary key default gen_random_uuid(),
    date date not null default now(),
    class_id uuid not null references public.classes(id) on delete cascade,
    subject_id uuid not null references public.subjects(id) on delete cascade,
    school_year_id uuid references public.school_years(id) on delete set null,
    meeting_number integer,
    learning_objectives text not null,
    learning_activities text not null,
    assessment text,
    reflection text,
    teacher_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamp with time zone default now()
);

-- Personal Agenda table
create table agendas (
    id uuid not null primary key default gen_random_uuid(),
    date date not null,
    title text not null,
    description text,
    tag text,
    color text default '#6b7280', -- default gray
    start_time time,
    end_time time,
    teacher_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamp with time zone default now()
);


-- RLS Policies
alter table profiles enable row level security;
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can manage all profiles" on profiles for all using ( (select role from profiles where id = auth.uid()) = 'admin' );

alter table activation_codes enable row level security;
create policy "Admins can manage activation codes" on activation_codes for all using ( (select role from profiles where id = auth.uid()) = 'admin' );
create policy "Users can view activation codes" on activation_codes for select using (auth.role() = 'authenticated');

alter table classes enable row level security;
create policy "Users can view their own classes" on classes for select using (auth.uid() = teacher_id);
create policy "Users can manage their own classes" on classes for all using (auth.uid() = teacher_id);

alter table subjects enable row level security;
create policy "Users can view their own subjects" on subjects for select using (auth.uid() = teacher_id);
create policy "Users can manage their own subjects" on subjects for all using (auth.uid() = teacher_id);

alter table school_years enable row level security;
create policy "Users can view their own school years" on school_years for select using (auth.uid() = teacher_id);
create policy "Users can manage their own school years" on school_years for all using (auth.uid() = teacher_id);

alter table students enable row level security;
create policy "Teachers can view their own students" on students for select using (auth.uid() = (select teacher_id from classes where id = students.class_id));
create policy "Teachers can insert students into their own classes" on students for insert with check (auth.uid() = (select teacher_id from classes where id = students.class_id));
create policy "Teachers can update their own students" on students for update using (auth.uid() = (select teacher_id from classes where id = students.class_id));

alter table schedule enable row level security;
create policy "Users can view their own schedule" on schedule for select using (auth.uid() = teacher_id);
create policy "Users can manage their own schedule" on schedule for all using (auth.uid() = teacher_id);

alter table attendance_history enable row level security;
create policy "Users can view their own attendance history" on attendance_history for select using (auth.uid() = teacher_id);
create policy "Users can manage their own attendance history" on attendance_history for all using (auth.uid() = teacher_id);

alter table grade_history enable row level security;
create policy "Users can view their own grade history" on grade_history for select using (auth.uid() = teacher_id);
create policy "Users can manage their own grade history" on grade_history for all using (auth.uid() = teacher_id);

alter table journals enable row level security;
create policy "Users can view their own journals" on journals for select using (auth.uid() = teacher_id);
create policy "Users can manage their own journals" on journals for all using (auth.uid() = teacher_id);

alter table agendas enable row level security;
create policy "Users can view their own agendas" on agendas for select using (auth.uid() = teacher_id);
create policy "Users can manage their own agendas" on agendas for all using (auth.uid() = teacher_id);

-- This trigger automatically creates a profile for a new user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
  
-- This trigger automatically deletes a profile when a user is deleted.
create function public.handle_delete_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.handle_delete_user();

-- Function to activate account and use a code
create or replace function activate_account_with_code(activation_code_to_use text, user_id_to_activate uuid, user_email_to_set text)
returns void
language plpgsql
as $$
declare
  code_id uuid;
begin
  -- Find the code and lock it
  select id into code_id from activation_codes
  where code = activation_code_to_use and not is_used for update;

  -- If code doesn't exist or is used, raise an error
  if not found then
    raise exception 'Kode aktivasi tidak valid atau sudah pernah digunakan.';
  end if;
  
  -- Update profile status
  update profiles
  set account_status = 'Pro'
  where id = user_id_to_activate;

  -- Mark the code as used
  update activation_codes
  set is_used = true, used_by = user_id_to_activate, used_at = now()
  where id = code_id;
end;
$$;


-- RPC to add student with teacher check
create or replace function add_student_with_teacher_check(
    p_class_id uuid,
    p_nis text,
    p_name text,
    p_gender text
)
returns void
language plpgsql
as $$
declare
    v_teacher_id uuid;
begin
    -- Get the teacher_id from the class
    select teacher_id into v_teacher_id
    from public.classes
    where id = p_class_id;

    -- Check if the calling user is the teacher of the class
    if v_teacher_id is null or v_teacher_id != auth.uid() then
        raise exception 'User is not authorized to add students to this class.';
    end if;

    -- Check for duplicate NIS for the same teacher across all their classes
    if exists (
        select 1
        from public.students s
        join public.classes c on s.class_id = c.id
        where c.teacher_id = v_teacher_id and s.nis = p_nis
    ) then
        raise exception 'NIS already exists for this teacher.';
    end if;

    -- Insert the new student
    insert into public.students (class_id, nis, name, gender, status)
    values (p_class_id, p_nis, p_name, p_gender, 'active');
end;
$$;


-- Views for easier reporting
create or replace view public.v_attendance_history as
select
    ah.id,
    ah.date,
    extract(month from ah.date) as month,
    ah.class_id,
    c.name as class_name,
    ah.subject_id,
    s.name as subject_name,
    ah.school_year_id,
    ah.meeting_number,
    ah.records,
    ah.teacher_id,
    (select jsonb_object_agg(student.id, student.name)
     from jsonb_to_recordset(ah.records) as item(student_id uuid),
          public.students as student
     where student.id = item.student_id) as student_names
from
    attendance_history ah
join
    classes c on ah.class_id = c.id
join
    subjects s on ah.subject_id = s.id;


create or replace view public.v_grade_history as
select
    gh.id,
    gh.date,
    extract(month from gh.date) as month,
    gh.class_id,
    c.name as class_name,
    gh.subject_id,
    s.name as subject_name,
    gh.school_year_id,
    gh.assessment_type,
    gh.records,
    gh.teacher_id,
    (select jsonb_object_agg(student.id, student.name)
     from jsonb_to_recordset(gh.records) as item(student_id uuid),
          public.students as student
     where student.id = item.student_id) as student_names
from
    grade_history gh
join
    classes c on gh.class_id = c.id
join
    subjects s on gh.subject_id = s.id;
