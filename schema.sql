
-- Enable RLS
alter table profiles enable row level security;
alter table classes enable row level security;
alter table subjects enable row level security;
alter table students enable row level security;
alter table schedule enable row level security;
alter table attendance_history enable row level security;
alter table grade_history enable row level security;
alter table journals enable row level security;
alter table activation_codes enable row level security;
alter table school_years enable row level security;
alter table agendas enable row level security;

-- Create policies
-- Profiles are public
create policy "Profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);

-- Classes are private
create policy "Classes are viewable by the user who created them." on classes for select using (auth.uid() = teacher_id);
create policy "Users can insert their own classes." on classes for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own classes." on classes for update using (auth.uid() = teacher_id);
create policy "Users can delete their own classes." on classes for delete using (auth.uid() = teacher_id);

-- Subjects are private
create policy "Subjects are viewable by the user who created them." on subjects for select using (auth.uid() = teacher_id);
create policy "Users can insert their own subjects." on subjects for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own subjects." on subjects for update using (auth.uid() = teacher_id);
create policy "Users can delete their own subjects." on subjects for delete using (auth.uid() = teacher_id);

-- Students are private, but more complex
create policy "Students are viewable by the teacher of their class." on students
  for select using (
    exists (
      select 1 from classes
      where classes.id = students.class_id and classes.teacher_id = auth.uid()
    )
  );

create policy "Teachers can insert students into their own classes." on students
  for insert with check (
    exists (
      select 1 from classes
      where classes.id = students.class_id and classes.teacher_id = auth.uid()
    )
  );
  
create policy "Teachers can update students in their own classes." on students
  for update using (
    exists (
      select 1 from classes
      where classes.id = students.class_id and classes.teacher_id = auth.uid()
    )
  );

-- Schedule items are private
create policy "Schedule items are viewable by the user who created them." on schedule for select using (auth.uid() = teacher_id);
create policy "Users can insert their own schedule." on schedule for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own schedule." on schedule for update using (auth.uid() = teacher_id);
create policy "Users can delete their own schedule." on schedule for delete using (auth.uid() = teacher_id);

-- Agendas are private
create policy "Agendas are viewable by the user who created them." on agendas for select using (auth.uid() = teacher_id);
create policy "Users can insert their own agendas." on agendas for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own agendas." on agendas for update using (auth.uid() = teacher_id);
create policy "Users can delete their own agendas." on agendas for delete using (auth.uid() = teacher_id);

-- Attendance history is private
create policy "Attendance history is viewable by the user who created it." on attendance_history for select using (auth.uid() = teacher_id);
create policy "Users can insert their own attendance history." on attendance_history for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own attendance history." on attendance_history for update using (auth.uid() = teacher_id);

-- Grade history is private
create policy "Grade history is viewable by the user who created it." on grade_history for select using (auth.uid() = teacher_id);
create policy "Users can insert their own grade history." on grade_history for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own grade history." on grade_history for update using (auth.uid() = teacher_id);

-- Journals are private
create policy "Journals are viewable by the user who created them." on journals for select using (auth.uid() = teacher_id);
create policy "Users can insert their own journals." on journals for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own journals." on journals for update using (auth.uid() = teacher_id);
create policy "Users can delete their own journals." on journals for delete using (auth.uid() = teacher_id);

-- School years are private
create policy "School years are viewable by the user who created them." on school_years for select using (auth.uid() = teacher_id);
create policy "Users can insert their own school years." on school_years for insert with check (auth.uid() = teacher_id);
create policy "Users can delete their own school years." on school_years for delete using (auth.uid() = teacher_id);

-- Policies for activation codes (Admin only)
create policy "Admin users can manage activation codes" on activation_codes
  for all using (
    exists (
      select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  ) with check (
    exists (
      select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Function to create a profile for a new user
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

-- Trigger to call the function when a new user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Function to delete a profile when a user is deleted
create function public.handle_user_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

-- Trigger to call the function when a user is deleted
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.handle_user_delete();
  
-- Function for an admin to delete a user. Bypasses RLS.
create or replace function delete_user_by_admin(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if the caller is an admin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only admin can delete users.';
  end if;
  
  delete from auth.users where id = user_id;
end;
$$;


-- RPC to activate account
create or replace function activate_account_with_code(
    activation_code_to_use text,
    user_id_to_activate uuid,
    user_email_to_set text
)
returns void as $$
declare
    code_id uuid;
    is_code_used boolean;
begin
    -- Check if code exists and is not used
    select id, is_used into code_id, is_code_used
    from public.activation_codes
    where code = activation_code_to_use;

    if code_id is null then
        raise exception 'Code not found';
    end if;

    if is_code_used then
        raise exception 'Code already used';
    end if;

    -- Update the profile to 'Pro'
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
$$ language plpgsql security definer;


-- Function to ensure a teacher cannot have students with the same NIS across their classes.
create or replace function add_student_with_teacher_check(
    p_class_id uuid,
    p_nis text,
    p_name text,
    p_gender text
)
returns void as $$
declare
    v_teacher_id uuid;
begin
    -- Get the teacher_id for the given p_class_id
    select teacher_id into v_teacher_id from public.classes where id = p_class_id;

    -- Check if a student with the same NIS already exists for this teacher
    if exists (
        select 1
        from public.students s
        join public.classes c on s.class_id = c.id
        where c.teacher_id = v_teacher_id and s.nis = p_nis
    ) then
        raise exception 'NIS already exists for this teacher';
    end if;

    -- If the check passes, insert the new student
    insert into public.students(class_id, nis, name, gender, status)
    values(p_class_id, p_nis, p_name, p_gender, 'active');
end;
$$ language plpgsql;


-- Add a unique constraint to school_years table
-- This prevents a teacher from creating duplicate year/semester names.
ALTER TABLE public.school_years
ADD CONSTRAINT unique_school_year_for_teacher UNIQUE (name, teacher_id);


-- Function to get all report data
create
or replace function get_report_data (
  p_teacher_id uuid,
  p_school_year_id uuid default null,
  p_month int default null
) returns table (
  summary_cards json,
  student_performance json,
  attendance_by_class json,
  overall_attendance_distribution json,
  journal_entries json,
  attendance_history json,
  grade_history json,
  all_students json
) as $$
declare
  v_summary_cards json;
  v_student_performance json;
  v_attendance_by_class json;
  v_overall_attendance_distribution json;
  v_journal_entries json;
  v_attendance_history json;
  v_grade_history json;
  v_all_students json;
begin
    -- Step 1: Filter raw data based on parameters
    -- Using temp tables to store intermediate filtered results
    create temp table temp_filtered_attendance on commit drop as
    select * from public.attendance_history
    where teacher_id = p_teacher_id
    and (p_school_year_id is null or school_year_id = p_school_year_id)
    and (p_month is null or extract(month from date) = p_month);

    create temp table temp_filtered_grades on commit drop as
    select * from public.grade_history
    where teacher_id = p_teacher_id
    and (p_school_year_id is null or school_year_id = p_school_year_id)
    and (p_month is null or extract(month from date) = p_month);

    create temp table temp_filtered_journals on commit drop as
    select * from public.journals
    where teacher_id = p_teacher_id
    and (p_school_year_id is null or school_year_id = p_school_year_id)
    and (p_month is null or extract(month from date) = p_month);

    create temp table temp_teacher_students on commit drop as
    select s.id, s.name, s.class_id, c.name as class_name
    from public.students s
    join public.classes c on s.class_id = c.id
    where c.teacher_id = p_teacher_id and s.status = 'active';

    -- Step 2: Calculate each JSON object separately, coalescing empty results.
    
    -- Summary Cards
    select into v_summary_cards json_build_object(
      'overallAttendanceRate', coalesce((select (sum(case when (r->>'status') = 'Hadir' then 1 else 0 end)::decimal / nullif(count(*), 0)) * 100 from temp_filtered_attendance, jsonb_to_recordset(records) as r(status text)), 0),
      'overallAverageGrade', coalesce((select avg((r->>'score')::numeric) from temp_filtered_grades, jsonb_to_recordset(records) as r(score text)), 0),
      'totalJournals', coalesce((select count(*) from temp_filtered_journals), 0)
    );

    -- Student Performance
    select into v_student_performance coalesce(json_agg(sp), '[]'::json) from (
      select
          s.id,
          s.name,
          s.class_name as class,
          round(coalesce(avg((gr.r->>'score')::numeric), 0), 1) as average_grade,
          round(coalesce((sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100, 100)) as attendance,
          case
              when coalesce(avg((gr.r->>'score')::numeric), 0) >= 85 and coalesce((sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100, 100) >= 90 then 'Sangat Baik'
              when coalesce(avg((gr.r->>'score')::numeric), 0) >= 75 and coalesce((sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100, 100) >= 80 then 'Stabil'
              when coalesce(avg((gr.r->>'score')::numeric), 0) < 70 or coalesce((sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100, 100) < 70 then 'Berisiko'
              else 'Butuh Perhatian'
          end as status
      from temp_teacher_students s
      left join (select id, records from temp_filtered_attendance) fa on true
      left join jsonb_to_recordset(fa.records) as ar(r) on (ar.r->>'student_id')::uuid = s.id
      left join (select id, records from temp_filtered_grades) fg on true
      left join jsonb_to_recordset(fg.records) as gr(r) on (gr.r->>'student_id')::uuid = s.id
      group by s.id, s.name, s.class_name
      order by average_grade desc
    ) sp;

    -- Attendance by Class
    select into v_attendance_by_class coalesce(json_agg(abc), '[]'::json) from (
        select
            c.name,
            sum(case when r.status = 'Hadir' then 1 else 0 end) as "Hadir",
            sum(case when r.status = 'Sakit' then 1 else 0 end) as "Sakit",
            sum(case when r.status = 'Izin' then 1 else 0 end) as "Izin",
            sum(case when r.status = 'Alpha' then 1 else 0 end) as "Alpha"
        from temp_filtered_attendance fa
        join public.classes c on fa.class_id = c.id,
        jsonb_to_recordset(fa.records) as r(status text)
        group by c.name
    ) abc;

    -- Overall Attendance Distribution
    select into v_overall_attendance_distribution coalesce(json_object_agg(status, count), '{}'::json) from (
      select r->>'status' as status, count(*) from temp_filtered_attendance, jsonb_array_elements(records) as r group by r->>'status'
    ) t;

    -- Journal, Attendance, Grade History, All Students
    select into v_journal_entries coalesce(json_agg(j), '[]'::json) from (select j.*, c.name as "className", s.name as "subjectName" from temp_filtered_journals j join public.classes c on j.class_id = c.id join public.subjects s on j.subject_id = s.id order by j.date desc) j;
    select into v_attendance_history coalesce(json_agg(ah), '[]'::json) from (select ah.*, c.name as "className", s.name as "subjectName" from temp_filtered_attendance ah join public.classes c on ah.class_id = c.id join public.subjects s on ah.subject_id = s.id order by ah.date desc) ah;
    select into v_grade_history coalesce(json_agg(gh), '[]'::json) from (select gh.*, c.name as "className", s.name as "subjectName" from temp_filtered_grades gh join public.classes c on gh.class_id = c.id join public.subjects s on gh.subject_id = s.id order by gh.date desc) gh;
    select into v_all_students coalesce(json_agg(s), '[]'::json) from temp_teacher_students s;

    -- Step 3: Return the final combined JSON object
    return query select
        v_summary_cards,
        v_student_performance,
        v_attendance_by_class,
        v_overall_attendance_distribution,
        v_journal_entries,
        v_attendance_history,
        v_grade_history,
        v_all_students;
end;
$$ language plpgsql;

