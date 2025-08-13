-- Initial tables

-- profiles table to store user data
create table
  public.profiles (
    id uuid not null,
    created_at timestamp with time zone not null default now(),
    full_name text not null,
    avatar_url text null,
    nip text null,
    pangkat text null,
    jabatan text null,
    school_name text null,
    school_address text null,
    headmaster_name text null,
    headmaster_nip text null,
    school_logo_url text null,
    account_status text not null default 'Free'::text,
    role text not null default 'teacher'::text,
    email text null,
    active_school_year_id uuid null,
    constraint profiles_pkey primary key (id),
    constraint profiles_email_key unique (email),
    constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade
  ) tablespace pg_default;

alter table public.profiles enable row level security;
create policy "Users can see their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

-- activation_codes table
create table
  public.activation_codes (
    id uuid not null default gen_random_uuid (),
    code text not null,
    is_used boolean not null default false,
    used_by uuid null,
    used_at timestamp with time zone null,
    created_at timestamp with time zone not null default now(),
    constraint activation_codes_pkey primary key (id),
    constraint activation_codes_code_key unique (code),
    constraint activation_codes_used_by_fkey foreign key (used_by) references auth.users (id) on delete set null
  ) tablespace pg_default;
  
alter table public.activation_codes enable row level security;
create policy "Admins can manage activation codes" on public.activation_codes for all using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
create policy "Users can see their own used code" on public.activation_codes for select using (used_by = auth.uid());


-- classes table
create table
  public.classes (
    id uuid not null default gen_random_uuid (),
    name text not null,
    teacher_id uuid not null,
    constraint classes_pkey primary key (id),
    constraint classes_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade
  ) tablespace pg_default;

alter table public.classes enable row level security;
create policy "Teachers can manage their own classes" on public.classes for all using (auth.uid() = teacher_id);


-- students table
create table
  public.students (
    id uuid not null default gen_random_uuid (),
    name text not null,
    nis text not null,
    gender text not null,
    class_id uuid not null,
    status text not null default 'active'::text,
    constraint students_pkey primary key (id),
    constraint students_class_id_fkey foreign key (class_id) references classes (id) on delete cascade,
    constraint students_teacher_id_nis_key unique (nis, class_id)
  ) tablespace pg_default;

alter table public.students enable row level security;
create policy "Teachers can read their own students" on public.students for select using (
  auth.uid() in (select teacher_id from classes where id = students.class_id)
);
create policy "Teachers can insert students into their own classes" on public.students for insert with check (
  auth.uid() = (select teacher_id from classes where id = students.class_id)
);
create policy "Teachers can update their own students" on public.students for update using (
  auth.uid() = (select teacher_id from classes where id = students.class_id)
);


-- subjects table
create table
  public.subjects (
    id uuid not null default gen_random_uuid (),
    name text not null,
    kkm numeric not null default 75,
    teacher_id uuid not null,
    constraint subjects_pkey primary key (id),
    constraint subjects_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade
  ) tablespace pg_default;

alter table public.subjects enable row level security;
create policy "Teachers can manage their own subjects" on public.subjects for all using (auth.uid() = teacher_id);


-- school_years table
create table
  public.school_years (
    id uuid not null default gen_random_uuid (),
    name text not null,
    teacher_id uuid not null,
    constraint school_years_pkey primary key (id),
    constraint school_years_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade
  ) tablespace pg_default;
  
alter table public.school_years enable row level security;
create policy "Teachers can manage their own school years" on public.school_years for all using (auth.uid() = teacher_id);


-- attendance_history table
create table
  public.attendance_history (
    id uuid not null default gen_random_uuid (),
    date date not null,
    class_id uuid not null,
    subject_id uuid not null,
    meeting_number integer not null,
    records jsonb not null,
    teacher_id uuid not null,
    school_year_id uuid null,
    constraint attendance_history_pkey primary key (id),
    constraint attendance_history_class_id_fkey foreign key (class_id) references classes (id) on delete cascade,
    constraint attendance_history_subject_id_fkey foreign key (subject_id) references subjects (id) on delete cascade,
    constraint attendance_history_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade,
    constraint attendance_history_school_year_id_fkey foreign key (school_year_id) references school_years(id) on delete set null
  ) tablespace pg_default;

alter table public.attendance_history enable row level security;
create policy "Teachers can manage their own attendance" on public.attendance_history for all using (auth.uid() = teacher_id);

-- grade_history table
create table
  public.grade_history (
    id uuid not null default gen_random_uuid (),
    date date not null,
    class_id uuid not null,
    subject_id uuid not null,
    assessment_type text not null,
    records jsonb not null,
    teacher_id uuid not null,
    school_year_id uuid null,
    constraint grade_history_pkey primary key (id),
    constraint grade_history_class_id_fkey foreign key (class_id) references classes (id) on delete cascade,
    constraint grade_history_subject_id_fkey foreign key (subject_id) references subjects (id) on delete cascade,
    constraint grade_history_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade,
    constraint grade_history_school_year_id_fkey foreign key (school_year_id) references school_years(id) on delete set null
  ) tablespace pg_default;

alter table public.grade_history enable row level security;
create policy "Teachers can manage their own grades" on public.grade_history for all using (auth.uid() = teacher_id);

-- journals table
create table
  public.journals (
    id uuid not null default gen_random_uuid (),
    date date not null,
    class_id uuid not null,
    subject_id uuid not null,
    meeting_number integer null,
    learning_objectives text not null,
    learning_activities text not null,
    assessment text null,
    reflection text null,
    teacher_id uuid not null,
    school_year_id uuid null,
    constraint journals_pkey primary key (id),
    constraint journals_class_id_fkey foreign key (class_id) references classes (id) on delete cascade,
    constraint journals_subject_id_fkey foreign key (subject_id) references subjects (id) on delete cascade,
    constraint journals_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade,
    constraint journals_school_year_id_fkey foreign key (school_year_id) references school_years(id) on delete set null
  ) tablespace pg_default;
  
alter table public.journals enable row level security;
create policy "Teachers can manage their own journals" on public.journals for all using (auth.uid() = teacher_id);


-- schedule table
create table
  public.schedule (
    id uuid not null default gen_random_uuid (),
    day text not null,
    start_time time without time zone not null,
    end_time time without time zone not null,
    subject_id uuid not null,
    class_id uuid not null,
    teacher_id uuid not null,
    constraint schedule_pkey primary key (id),
    constraint schedule_class_id_fkey foreign key (class_id) references classes (id) on delete cascade,
    constraint schedule_subject_id_fkey foreign key (subject_id) references subjects (id) on delete cascade,
    constraint schedule_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade
  ) tablespace pg_default;

alter table public.schedule enable row level security;
create policy "Teachers can manage their own schedule" on public.schedule for all using (auth.uid() = teacher_id);

-- agendas table
create table
  public.agendas (
    id uuid not null default gen_random_uuid (),
    date date not null,
    title text not null,
    description text null,
    tag text null,
    color text null,
    start_time time without time zone null,
    end_time time without time zone null,
    teacher_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint agendas_pkey primary key (id),
    constraint agendas_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade
  ) tablespace pg_default;

alter table public.agendas enable row level security;
create policy "Teachers can manage their own agendas" on public.agendas for all using (auth.uid() = teacher_id);


-- Functions and Triggers
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


create function public.activate_account_with_code(activation_code_to_use text, user_id_to_activate uuid, user_email_to_set text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  code_id uuid;
begin
  -- Check if the code exists and is not used
  select id into code_id from public.activation_codes where code = activation_code_to_use and is_used = false;

  if code_id is null then
    raise exception 'Code not found or already used';
  end if;

  -- Update the activation code record
  update public.activation_codes
  set 
    is_used = true,
    used_by = user_id_to_activate,
    used_at = now()
  where id = code_id;

  -- Update the user's profile status
  update public.profiles
  set account_status = 'Pro'
  where id = user_id_to_activate;
end;
$$;


create function public.add_student_with_teacher_check(p_class_id uuid, p_nis text, p_name text, p_gender text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_teacher_id uuid;
  v_existing_student_id uuid;
begin
  -- Get the teacher_id from the class
  select teacher_id into v_teacher_id from public.classes where id = p_class_id;

  -- Check if the calling user is the teacher of the class
  if v_teacher_id != auth.uid() then
    raise exception 'Unauthorized: You are not the teacher of this class.';
  end if;

  -- Check if a student with the same NIS already exists for this teacher across all their classes
  select s.id into v_existing_student_id
  from public.students s
  join public.classes c on s.class_id = c.id
  where s.nis = p_nis and c.teacher_id = v_teacher_id;

  if v_existing_student_id is not null then
    raise exception 'NIS already exists for this teacher';
  end if;

  -- Insert the new student
  insert into public.students(class_id, nis, name, gender, status)
  values (p_class_id, p_nis, p_name, p_gender, 'active');
end;
$$;


-- REPORTING VIEWS
CREATE OR REPLACE VIEW public.v_attendance_history AS
SELECT 
    ah.id,
    ah.date,
    ah.class_id,
    ah.subject_id,
    ah.school_year_id,
    ah.meeting_number,
    ah.records,
    ah.teacher_id,
    c.name as class_name,
    s.name as subject_name,
    (
        SELECT jsonb_object_agg(st.id, st.name)
        FROM jsonb_to_recordset(ah.records) as r(student_id uuid, status text)
        JOIN students st on st.id = r.student_id
    ) as student_names
FROM 
    attendance_history ah
JOIN 
    classes c ON ah.class_id = c.id
JOIN 
    subjects s ON ah.subject_id = s.id;


CREATE OR REPLACE VIEW public.v_grade_history AS
SELECT 
    gh.id,
    gh.date,
    gh.class_id,
    gh.subject_id,
    gh.school_year_id,
    gh.assessment_type,
    gh.records,
    gh.teacher_id,
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
     (
        SELECT jsonb_object_agg(st.id, st.name)
        FROM jsonb_to_recordset(gh.records) as r(student_id uuid, score text)
        JOIN students st on st.id = r.student_id
    ) as student_names
FROM 
    grade_history gh
JOIN 
    classes c ON gh.class_id = c.id
JOIN 
    subjects s ON gh.subject_id = s.id;
