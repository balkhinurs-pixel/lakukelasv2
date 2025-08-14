
-- RLS POLICIES
alter table profiles enable row level security;
alter table classes enable row level security;
alter table subjects enable row level security;
alter table students enable row level security;
alter table schedule enable row level security;
alter table attendance_history enable row level security;
alter table grade_history enable row level security;
alter table journals enable row level security;
alter table agendas enable row level security;
alter table activation_codes enable row level security;
alter table school_years enable row level security;

-- PROFILES
create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- CLASSES
create policy "Users can view their own classes" on classes
  for select using (auth.uid() = teacher_id);
create policy "Users can insert their own classes" on classes
  for insert with check (auth.uid() = teacher_id);

-- SUBJECTS
create policy "Users can view their own subjects" on subjects
  for select using (auth.uid() = teacher_id);
create policy "Users can insert their own subjects" on subjects
  for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own subjects" on subjects
  for update using (auth.uid() = teacher_id);

-- SCHOOL YEARS
create policy "Users can view their own school years" on school_years
  for select using (auth.uid() = teacher_id);
create policy "Users can insert their own school years" on school_years
  for insert with check (auth.uid() = teacher_id);

-- STUDENTS
create policy "Teachers can view their own students" on students
  for select using (
    auth.uid() = (
      select teacher_id from classes where id = students.class_id
    )
  );

create policy "Teachers can insert students into their own classes" on students
  for insert with check (
    auth.uid() = (
      select teacher_id from classes where id = students.class_id
    )
  );
  
create policy "Teachers can update their own students" on students
  for update using (
    auth.uid() = (
      select teacher_id from classes where id = students.class_id
    )
  );


-- SCHEDULE
create policy "Users can manage their own schedule" on schedule
  for all using (auth.uid() = teacher_id);

-- ATTENDANCE HISTORY
create policy "Users can manage their own attendance history" on attendance_history
  for all using (auth.uid() = teacher_id);

-- GRADE HISTORY
create policy "Users can manage their own grade history" on grade_history
  for all using (auth.uid() = teacher_id);

-- JOURNALS
create policy "Users can manage their own journals" on journals
  for all using (auth.uid() = teacher_id);

-- AGENDAS
create policy "Users can manage their own agendas" on agendas
  for all using (auth.uid() = teacher_id);
  
-- ACTIVATION CODES
create policy "Admins can manage activation codes" on activation_codes
  for all using ( (select role from profiles where id = auth.uid()) = 'admin' );

create policy "Users can view their own used code" on activation_codes
  for select using ( auth.uid() = used_by );


-- FUNCTIONS

-- This trigger automatically creates a profile entry when a new user signs up.
-- see https://supabase.com/docs/guides/auth/managing-user-data
create or replace function public.handle_new_user()
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

-- trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- This trigger automatically deletes a profile entry when a user is deleted.
create or replace function public.handle_user_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

create or replace trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.handle_user_delete();

-- Function to activate account and redeem code
create or replace function public.activate_account_with_code(
    activation_code_to_use text,
    user_id_to_activate uuid,
    user_email_to_set text
)
returns void
language plpgsql
as $$
declare
    code_id uuid;
begin
    -- Check if the code exists and is not used, and get its ID
    select id into code_id from public.activation_codes
    where code = activation_code_to_use and is_used = false;

    -- If no such code is found, raise an exception
    if code_id is null then
        raise exception 'Code not found or already used';
    end if;
    
    -- Update the profiles table
    update public.profiles
    set account_status = 'Pro'
    where id = user_id_to_activate;

    -- Update the activation_codes table
    update public.activation_codes
    set 
        is_used = true,
        used_by = user_id_to_activate,
        used_by_email = user_email_to_set,
        used_at = now()
    where id = code_id;

end;
$$;


-- Function to add student with teacher check
create or replace function public.add_student_with_teacher_check(
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
    -- Ensure the user is the teacher of the target class
    select teacher_id into v_teacher_id from public.classes where id = p_class_id;
    if v_teacher_id is null or v_teacher_id != auth.uid() then
        raise exception 'User is not the teacher of the target class';
    end if;

    -- Check if a student with the same NIS already exists for this teacher across all their classes
    if exists (
        select 1
        from public.students s
        join public.classes c on s.class_id = c.id
        where c.teacher_id = v_teacher_id and s.nis = p_nis
    ) then
        raise exception 'NIS already exists for this teacher';
    end if;

    -- Insert the new student
    insert into public.students (class_id, nis, name, gender, status)
    values (p_class_id, p_nis, p_name, p_gender, 'active');
end;
$$;


-- Function to get all report data
drop function if exists get_report_data(uuid, uuid, integer);
create or replace function get_report_data(p_teacher_id uuid, p_school_year_id uuid, p_month integer)
returns table (
    attendance_history json[],
    grade_history json[],
    journal_entries json[],
    all_students json[],
    attendance_by_class json[]
)
language plpgsql
as $$
begin
    return query
    with filtered_attendance as (
        select * from public.attendance_history ah
        where ah.teacher_id = p_teacher_id
          and (p_month is null or extract(month from ah.date) = p_month)
          and (p_month is not null or ah.school_year_id = p_school_year_id)
    ),
    filtered_grades as (
        select * from public.grade_history gh
        where gh.teacher_id = p_teacher_id
          and (p_month is null or extract(month from gh.date) = p_month)
          and (p_month is not null or gh.school_year_id = p_school_year_id)
    ),
    filtered_journals as (
        select * from public.journals j
        where j.teacher_id = p_teacher_id
          and (p_month is null or extract(month from j.date) = p_month)
          and (p_month is not null or j.school_year_id = p_school_year_id)
    ),
    distinct_students as (
        select distinct s.id, s.name, s.nis, c.id as class_id, c.name as class_name from public.students s
        join public.classes c on s.class_id = c.id
        where c.teacher_id = p_teacher_id
    )
    select
        (select array_to_json(array_agg(row_to_json(t))) from (
            select ah.id, ah.date, ah.meeting_number, ah.records, ah.class_id, ah.subject_id,
                   c.name as class_name, sub.name as subject_name
            from filtered_attendance ah
            join public.classes c on ah.class_id = c.id
            join public.subjects sub on ah.subject_id = sub.id
        ) t) as attendance_history,

        (select array_to_json(array_agg(row_to_json(t))) from (
            select gh.id, gh.date, gh.assessment_type, gh.records, gh.class_id, gh.subject_id,
                   c.name as class_name, sub.name as subject_name
            from filtered_grades gh
            join public.classes c on gh.class_id = c.id
            join public.subjects sub on gh.subject_id = sub.id
        ) t) as grade_history,

        (select array_to_json(array_agg(row_to_json(t))) from (
             select j.id, j.date, j.meeting_number, j.learning_objectives, j.class_id, j.subject_id,
                   c.name as class_name, sub.name as subject_name
            from filtered_journals j
            join public.classes c on j.class_id = c.id
            join public.subjects sub on j.subject_id = sub.id
        ) t) as journal_entries,
        
        (select array_to_json(array_agg(row_to_json(t))) from (
            select * from distinct_students
        ) t) as all_students,

        (select array_to_json(array_agg(row_to_json(t))) from (
            select
                c.id as class_id,
                c.name as class_name,
                json_agg(json_build_object('status', r.status, 'count', r.count)) as distribution
            from
                public.classes c
            left join (
                select
                    ah.class_id,
                    (jsonb_array_elements(ah.records)->>'status') as status,
                    count(*) as count
                from
                    filtered_attendance ah
                group by
                    ah.class_id,
                    status
            ) r on c.id = r.class_id
            where c.teacher_id = p_teacher_id
            group by c.id, c.name
        ) t) as attendance_by_class;
end;
$$;
