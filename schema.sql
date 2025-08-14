
-- RLS Policies
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

alter table classes enable row level security;
create policy "Classes are viewable by the user who created them." on classes for select using (auth.uid() = teacher_id);
create policy "Users can insert their own classes." on classes for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own classes." on classes for update using (auth.uid() = teacher_id);
create policy "Users can delete their own classes." on classes for delete using (auth.uid() = teacher_id);

alter table subjects enable row level security;
create policy "Subjects are viewable by the user who created them." on subjects for select using (auth.uid() = teacher_id);
create policy "Users can insert their own subjects." on subjects for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own subjects." on subjects for update using (auth.uid() = teacher_id);
create policy "Users can delete their own subjects." on subjects for delete using (auth.uid() = teacher_id);

alter table students enable row level security;
create policy "Students are viewable by the user who created them." on students for select using (exists (select 1 from classes where classes.id = students.class_id and classes.teacher_id = auth.uid()));
create policy "Users can insert students into their own classes." on students for insert with check (exists (select 1 from classes where classes.id = students.class_id and classes.teacher_id = auth.uid()));
create policy "Users can update students in their own classes." on students for update using (exists (select 1 from classes where classes.id = students.class_id and classes.teacher_id = auth.uid()));
create policy "Users can delete students in their own classes." on students for delete using (exists (select 1 from classes where classes.id = students.class_id and classes.teacher_id = auth.uid()));

alter table schedule enable row level security;
create policy "Schedule is viewable by the user who created it." on schedule for select using (auth.uid() = teacher_id);
create policy "Users can insert their own schedule." on schedule for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own schedule." on schedule for update using (auth.uid() = teacher_id);
create policy "Users can delete their own schedule." on schedule for delete using (auth.uid() = teacher_id);

alter table journals enable row level security;
create policy "Journals are viewable by the user who created them." on journals for select using (auth.uid() = teacher_id);
create policy "Users can insert their own journals." on journals for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own journals." on journals for update using (auth.uid() = teacher_id);
create policy "Users can delete their own journals." on journals for delete using (auth.uid() = teacher_id);

alter table attendance_history enable row level security;
create policy "Attendance history is viewable by the user who created it." on attendance_history for select using (auth.uid() = teacher_id);
create policy "Users can insert their own attendance history." on attendance_history for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own attendance history." on attendance_history for update using (auth.uid() = teacher_id);
create policy "Users can delete their own attendance history." on attendance_history for delete using (auth.uid() = teacher_id);

alter table grade_history enable row level security;
create policy "Grade history is viewable by the user who created it." on grade_history for select using (auth.uid() = teacher_id);
create policy "Users can insert their own grade history." on grade_history for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own grade history." on grade_history for update using (auth.uid() = teacher_id);
create policy "Users can delete their own grade history." on grade_history for delete using (auth.uid() = teacher_id);

alter table school_years enable row level security;
create policy "School years are viewable by the user who created them." on school_years for select using (auth.uid() = teacher_id);
create policy "Users can insert their own school years." on school_years for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own school years." on school_years for update using (auth.uid() = teacher_id);
create policy "Users can delete their own school years." on school_years for delete using (auth.uid() = teacher_id);

alter table agendas enable row level security;
create policy "Agendas are viewable by the user who created them." on agendas for select using (auth.uid() = teacher_id);
create policy "Users can insert their own agendas." on agendas for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own agendas." on agendas for update using (auth.uid() = teacher_id);
create policy "Users can delete their own agendas." on agendas for delete using (auth.uid() = teacher_id);


-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, role, account_status)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url', 'teacher', 'Free');
  return new;
end;
$$;

-- Trigger to call the function on new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Function to handle user deletion
create or replace function public.on_delete_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- When a user is deleted from auth.users, delete their corresponding profile
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

-- Trigger to call the function on user deletion
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.on_delete_user();


-- Function to activate account with code
CREATE OR REPLACE FUNCTION activate_account_with_code(
    activation_code_to_use TEXT,
    user_id_to_activate UUID,
    user_email_to_set TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_id_to_use UUID;
    is_code_used BOOLEAN;
BEGIN
    -- Check if the code exists and get its ID and status
    SELECT id, is_used INTO code_id_to_use, is_code_used
    FROM public.activation_codes
    WHERE code = activation_code_to_use;

    -- If code doesn't exist, raise an error
    IF code_id_to_use IS NULL THEN
        RAISE EXCEPTION 'Code not found';
    END IF;

    -- If code has already been used, raise an error
    IF is_code_used THEN
        RAISE EXCEPTION 'Code already used';
    END IF;

    -- Update the profiles table
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;

    -- Update the activation_codes table
    UPDATE public.activation_codes
    SET 
        is_used = TRUE,
        used_by = user_id_to_activate,
        used_at = NOW(),
        used_by_email = user_email_to_set
    WHERE id = code_id_to_use;
END;
$$;

-- Function to add student with teacher check
CREATE OR REPLACE FUNCTION add_student_with_teacher_check(
    p_class_id UUID,
    p_nis TEXT,
    p_name TEXT,
    p_gender TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_teacher_id UUID;
BEGIN
    -- Get the teacher_id from the class
    SELECT teacher_id INTO v_teacher_id FROM public.classes WHERE id = p_class_id;

    -- Check if a student with the same NIS already exists for this teacher
    IF EXISTS (
        SELECT 1
        FROM public.students s
        JOIN public.classes c ON s.class_id = c.id
        WHERE s.nis = p_nis AND c.teacher_id = v_teacher_id
    ) THEN
        RAISE EXCEPTION 'NIS already exists for this teacher';
    END IF;

    -- Insert the new student
    INSERT INTO public.students (class_id, nis, name, gender, status)
    VALUES (p_class_id, p_nis, p_name, p_gender::student_gender, 'active');
END;
$$;
