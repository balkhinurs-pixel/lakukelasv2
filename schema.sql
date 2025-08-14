-- Enable RLS
ALTER TABLE
  profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  students ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  attendance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  agendas ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR
SELECT
  USING (TRUE);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT
WITH
  CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR
UPDATE
  USING (auth.uid() = id);

-- CLASSES
CREATE POLICY "Users can view their own classes." ON classes FOR
SELECT
  USING (auth.uid() = teacher_id);
CREATE POLICY "Users can create classes." ON classes FOR INSERT
WITH
  CHECK (auth.uid() = teacher_id);
CREATE POLICY "Users can update their own classes." ON classes FOR
UPDATE
  USING (auth.uid() = teacher_id);

-- SUBJECTS
CREATE POLICY "Users can view their own subjects." ON subjects FOR
SELECT
  USING (auth.uid() = teacher_id);
CREATE POLICY "Users can create subjects." ON subjects FOR INSERT
WITH
  CHECK (auth.uid() = teacher_id);
CREATE POLICY "Users can update their own subjects." ON subjects FOR
UPDATE
  USING (auth.uid() = teacher_id);

-- STUDENTS
CREATE POLICY "Users can view students in their classes" ON students FOR
SELECT
  USING (
    EXISTS (
      SELECT
        1
      FROM
        classes
      WHERE
        classes.id = students.class_id
        AND classes.teacher_id = auth.uid()
    )
  );
CREATE POLICY "Users can add students to their own classes" ON students FOR INSERT
WITH
  CHECK (
    EXISTS (
      SELECT
        1
      FROM
        classes
      WHERE
        classes.id = students.class_id
        AND classes.teacher_id = auth.uid()
    )
  );
CREATE POLICY "Users can update students in their classes" ON students FOR
UPDATE
  USING (
    EXISTS (
      SELECT
        1
      FROM
        classes
      WHERE
        classes.id = students.class_id
        AND classes.teacher_id = auth.uid()
    )
  );

-- SCHEDULE
CREATE POLICY "Users can view their own schedule." ON schedule FOR
SELECT
  USING (auth.uid() = teacher_id);
CREATE POLICY "Users can create schedule entries." ON schedule FOR INSERT
WITH
  CHECK (auth.uid() = teacher_id);
CREATE POLICY "Users can update their own schedule." ON schedule FOR
UPDATE
  USING (auth.uid() = teacher_id);
CREATE POLICY "Users can delete their own schedule." ON schedule FOR DELETE USING (auth.uid() = teacher_id);

-- ATTENDANCE HISTORY
CREATE POLICY "Users can view their own attendance history." ON attendance_history FOR
SELECT
  USING (auth.uid() = teacher_id);
CREATE POLICY "Users can create attendance history." ON attendance_history FOR INSERT
WITH
  CHECK (auth.uid() = teacher_id);
CREATE POLICY "Users can update their own attendance history." ON attendance_history FOR
UPDATE
  USING (auth.uid() = teacher_id);

-- GRADE HISTORY
CREATE POLICY "Users can view their own grade history." ON grade_history FOR
SELECT
  USING (auth.uid() = teacher_id);
CREATE POLICY "Users can create grade history." ON grade_history FOR INSERT
WITH
  CHECK (auth.uid() = teacher_id);
CREATE POLICY "Users can update their own grade history." ON grade_history FOR
UPDATE
  USING (auth.uid() = teacher_id);

-- JOURNALS
CREATE POLICY "Users can view their own journals." ON journals FOR
SELECT
  USING (auth.uid() = teacher_id);
CREATE POLICY "Users can create journals." ON journals FOR INSERT
WITH
  CHECK (auth.uid() = teacher_id);
CREATE POLICY "Users can update their own journals." ON journals FOR
UPDATE
  USING (auth.uid() = teacher_id);
CREATE POLICY "Users can delete their own journals." ON journals FOR DELETE USING (auth.uid() = teacher_id);

-- ACTIVATION CODES
CREATE POLICY "Allow admin full access" ON activation_codes FOR ALL USING (
  EXISTS (
    SELECT
      1
    FROM
      profiles
    WHERE
      profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
)
WITH
  CHECK (
    EXISTS (
      SELECT
        1
      FROM
        profiles
      WHERE
        profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- SCHOOL YEARS
CREATE POLICY "Users can manage their own school years" ON school_years FOR ALL USING (auth.uid() = teacher_id);

-- AGENDAS
CREATE POLICY "Users can manage their own agendas" ON agendas FOR ALL USING (auth.uid() = teacher_id);


-- Create a function to handle new user creation and profile insertion
create
or replace function public.handle_new_user () returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role, account_status, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'teacher',
    'Free',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to call the function when a new user is created in auth.users
create trigger on_auth_user_created
after insert on auth.users for each row
execute procedure public.handle_new_user ();

-- Function to handle profile deletion when a user is deleted
create
or replace function public.handle_user_delete () returns trigger as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$ language plpgsql security definer;

-- Trigger for user deletion
create trigger on_auth_user_deleted
after delete on auth.users for each row
execute procedure public.handle_user_delete ();

-- Function for activating a user account with a code
CREATE
OR REPLACE FUNCTION activate_account_with_code(
  activation_code_to_use TEXT,
  user_id_to_activate UUID,
  user_email_to_set TEXT
) RETURNS VOID AS $$
DECLARE
    code_id UUID;
BEGIN
    -- Find the code and lock the row for update
    SELECT id INTO code_id FROM activation_codes WHERE code = activation_code_to_use AND NOT is_used FOR UPDATE;

    -- If no code is found, raise an exception
    IF code_id IS NULL THEN
        RAISE EXCEPTION 'Code not found or already used';
    END IF;

    -- Update the activation_codes table
    UPDATE activation_codes
    SET 
        is_used = TRUE,
        used_by = user_id_to_activate,
        used_at = NOW()
    WHERE id = code_id;

    -- Update the profiles table
    UPDATE profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;
END;
$$ LANGUAGE plpgsql;


-- Function for importing students, checks for duplicates
CREATE
OR REPLACE FUNCTION add_student_with_teacher_check(
  p_class_id UUID,
  p_nis TEXT,
  p_name TEXT,
  p_gender TEXT
) RETURNS VOID AS $$
DECLARE
    v_teacher_id UUID;
    v_nis_exists BOOLEAN;
BEGIN
    -- Get the teacher_id from the class
    SELECT teacher_id INTO v_teacher_id FROM classes WHERE id = p_class_id;

    -- Check if a student with the same NIS already exists for this teacher
    SELECT EXISTS (
        SELECT 1
        FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE c.teacher_id = v_teacher_id AND s.nis = p_nis
    ) INTO v_nis_exists;

    -- If the NIS already exists for the teacher, raise an exception
    IF v_nis_exists THEN
        RAISE EXCEPTION 'NIS already exists for this teacher';
    END IF;

    -- If the NIS does not exist, insert the new student
    INSERT INTO students (class_id, nis, name, gender, status)
    VALUES (p_class_id, p_nis, p_name, p_gender::gender, 'active');
END;
$$ LANGUAGE plpgsql;


-- Function for generating reports
-- Function for generating reports
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
  v_summary_cards jsonb;
  v_student_performance jsonb;
  v_attendance_by_class jsonb;
  v_overall_attendance_distribution jsonb;
  v_journal_entries jsonb;
  v_attendance_history jsonb;
  v_grade_history jsonb;
  v_all_students jsonb;
begin
  -- Base CTEs for filtered data
  with
  filtered_attendance as (
    select * from attendance_history
    where teacher_id = p_teacher_id
    and (p_school_year_id is null or school_year_id = p_school_year_id)
    and (p_month is null or extract(month from date) = p_month)
  ),
  filtered_grades as (
    select * from grade_history
    where teacher_id = p_teacher_id
    and (p_school_year_id is null or school_year_id = p_school_year_id)
    and (p_month is null or extract(month from date) = p_month)
  ),
  filtered_journals as (
     select * from journals
    where teacher_id = p_teacher_id
    and (p_school_year_id is null or school_year_id = p_school_year_id)
    and (p_month is null or extract(month from date) = p_month)
  ),
  teacher_students as (
    select s.id, s.name, s.nis, s.class_id, c.name as class_name
    from students s
    join classes c on s.class_id = c.id
    where c.teacher_id = p_teacher_id and s.status = 'active'
  )
  -- 1. Summary Cards
  select to_jsonb(t) into v_summary_cards from (
    select
      coalesce((select (sum(case when (r->>'status') = 'Hadir' then 1 else 0 end)::decimal / nullif(count(*), 0)) * 100 from filtered_attendance, jsonb_to_recordset(records) as r(student_id uuid, status text)), 0) as "overallAttendanceRate",
      coalesce((select avg((r->>'score')::numeric) from filtered_grades, jsonb_to_recordset(records) as r(student_id uuid, score text)), 0) as "overallAverageGrade",
      coalesce((select count(*) from filtered_journals), 0) as "totalJournals"
  ) t;

  -- 2. Student Performance
  select coalesce(jsonb_agg(sp), '[]'::jsonb) into v_student_performance from (
      select
          s.id,
          s.name,
          s.class_name,
          coalesce(avg((gr.r->>'score')::numeric), 0) as average_grade,
          coalesce((sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100, 100) as attendance_percentage,
          case
              when coalesce(avg((gr.r->>'score')::numeric), 0) >= 85 and coalesce((sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100, 100) >= 90 then 'Sangat Baik'
              when coalesce(avg((gr.r->>'score')::numeric), 0) >= 75 and coalesce((sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100, 100) >= 80 then 'Stabil'
              when coalesce(avg((gr.r->>'score')::numeric), 0) < 75 or coalesce((sum(case when ar.r->>'status' = 'Hadir' then 1 else 0 end)::decimal / nullif(count(ar.r), 0)) * 100, 100) < 80 then 'Butuh Perhatian'
              else 'Berisiko'
          end as status
      from teacher_students s
      left join filtered_attendance fa on true
      left join lateral jsonb_to_recordset(fa.records) as ar(r) on (ar.r->>'student_id')::uuid = s.id
      left join filtered_grades fg on true
      left join lateral jsonb_to_recordset(fg.records) as gr(r) on (gr.r->>'student_id')::uuid = s.id
      group by s.id, s.name, s.class_name
      order by average_grade desc
  ) sp;

  -- 3. Attendance by Class
  select coalesce(jsonb_agg(abc), '[]'::jsonb) into v_attendance_by_class from (
      select
          c.name as class_name,
          json_agg(json_build_object('status', r.status, 'count', count(r.status))) as distribution
      from filtered_attendance fa
      join classes c on fa.class_id = c.id,
      lateral jsonb_to_recordset(fa.records) as r(status text)
      group by c.name
  ) abc;

  -- 4. Overall Attendance Distribution
  select coalesce(jsonb_object_agg(status, count), '{}'::jsonb) into v_overall_attendance_distribution
    from (
        select r->>'status' as status, count(*)
        from filtered_attendance, jsonb_array_elements(records) as r
        group by r->>'status'
    ) t;

  -- 5. Journal Entries
  select coalesce(jsonb_agg(j), '[]'::jsonb) into v_journal_entries from (
      select j.id, j.date, j.class_id, j.subject_id, j.meeting_number, j.learning_objectives, j.learning_activities, j.assessment, j.reflection, c.name as "className", s.name as "subjectName"
      from filtered_journals j
      join classes c on j.class_id = c.id
      join subjects s on j.subject_id = s.id
      order by j.date desc
  ) j;

  -- 6. Attendance History
  select coalesce(jsonb_agg(ah), '[]'::jsonb) into v_attendance_history from (
    select ah.id, ah.date, ah.class_id, ah.subject_id, ah.meeting_number, ah.records, c.name as "className", s.name as "subjectName"
    from filtered_attendance ah
    join classes c on ah.class_id = c.id
    join subjects s on ah.subject_id = s.id
    order by ah.date desc
  ) ah;

  -- 7. Grade History
  select coalesce(jsonb_agg(gh), '[]'::jsonb) into v_grade_history from (
    select gh.id, gh.date, gh.class_id, gh.subject_id, gh.assessment_type, gh.records, c.name as "className", s.name as "subjectName"
    from filtered_grades gh
    join classes c on gh.class_id = c.id
    join subjects s on gh.subject_id = s.id
    order by gh.date desc
  ) gh;

  -- 8. All students
  select coalesce(jsonb_agg(s), '[]'::jsonb) into v_all_students from teacher_students s;

  -- Return all results
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
$$ language plpgsql volatile;
