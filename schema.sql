
-- RLS Policies for user data access
alter table "public"."profiles" enable row level security;
create policy "Users can view their own profile." on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);

alter table "public"."classes" enable row level security;
create policy "Users can manage their own classes" on classes for all using (auth.uid() = teacher_id);

alter table "public"."subjects" enable row level security;
create policy "Users can manage their own subjects" on subjects for all using (auth.uid() = teacher_id);

alter table "public"."school_years" enable row level security;
create policy "Users can manage their own school years" on school_years for all using (auth.uid() = teacher_id);

alter table "public"."schedule" enable row level security;
create policy "Users can manage their own schedule" on schedule for all using (auth.uid() = teacher_id);

alter table "public"."students" enable row level security;
CREATE POLICY "Users can manage students in their classes" ON public.students
FOR ALL
USING (
  teacher_id_of_class(class_id) = auth.uid()
);

alter table "public"."attendance_history" enable row level security;
create policy "Users can manage their own attendance history" on attendance_history for all using (auth.uid() = teacher_id);

alter table "public"."grade_history" enable row level security;
create policy "Users can manage their own grade history" on grade_history for all using (auth.uid() = teacher_id);

alter table "public"."journals" enable row level security;
create policy "Users can manage their own journals" on journals for all using (auth.uid() = teacher_id);

alter table "public"."agendas" enable row level security;
create policy "Users can manage their own agendas" on agendas for all using (auth.uid() = teacher_id);

alter table "public"."activation_codes" enable row level security;
create policy "Allow admin full access" on activation_codes for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "Allow users to read their own code" on activation_codes for select using (used_by = auth.uid());


-- This trigger automatically creates a profile entry when a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email, role, account_status)
  values (
      new.id,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'avatar_url',
      new.email,
      'teacher',
      'Free'
  );
  return new;
end;
$$;

-- trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Function to get teacher_id from a class_id
CREATE OR REPLACE FUNCTION teacher_id_of_class(p_class_id UUID)
RETURNS UUID AS $$
DECLARE
  v_teacher_id UUID;
BEGIN
  SELECT teacher_id INTO v_teacher_id
  FROM public.classes
  WHERE id = p_class_id;
  
  RETURN v_teacher_id;
END;
$$ LANGUAGE plpgsql;


-- Function to check if a user is an admin
create or replace function is_admin(user_id uuid)
returns boolean
language plpgsql
as $$
declare
  user_role text;
begin
  select role into user_role from public.profiles where id = user_id;
  return user_role = 'admin';
end;
$$;

-- Function to add a student, ensuring the teacher owns the class and the NIS is unique for that teacher.
CREATE OR REPLACE FUNCTION add_student_with_teacher_check(
    p_class_id UUID,
    p_nis TEXT,
    p_name TEXT,
    p_gender TEXT
)
RETURNS void AS $$
DECLARE
    v_teacher_id UUID;
    v_nis_exists INTEGER;
BEGIN
    -- 1. Get the teacher_id for the given class_id
    SELECT teacher_id INTO v_teacher_id
    FROM public.classes
    WHERE id = p_class_id;

    -- 2. Check if the calling user is the teacher for that class
    IF v_teacher_id IS NULL OR v_teacher_id != auth.uid() THEN
        RAISE EXCEPTION 'User is not authorized to add students to this class.';
    END IF;

    -- 3. Check if the NIS already exists for any student belonging to this teacher
    SELECT 1 INTO v_nis_exists
    FROM public.students s
    JOIN public.classes c ON s.class_id = c.id
    WHERE c.teacher_id = v_teacher_id AND s.nis = p_nis;

    IF v_nis_exists = 1 THEN
        RAISE EXCEPTION 'NIS already exists for this teacher.';
    END IF;

    -- 4. If all checks pass, insert the new student
    INSERT INTO public.students (class_id, nis, name, gender, status)
    VALUES (p_class_id, p_nis, p_name, p_gender, 'active');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER FUNCTION add_student_with_teacher_check(uuid, text, text, text) OWNER TO postgres;


-- RPC to activate a user account with a code
CREATE OR REPLACE FUNCTION activate_account_with_code(p_code TEXT, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_code_id UUID;
BEGIN
    -- Find the specific, unused code.
    SELECT id INTO v_code_id
    FROM public.activation_codes
    WHERE code = p_code AND is_used = FALSE
    LIMIT 1;

    -- If no such code is found, raise an error.
    IF v_code_id IS NULL THEN
        RAISE EXCEPTION 'Activation code is invalid or has already been used.';
    END IF;

    -- If we found a valid code, proceed with the transaction.
    -- Update the activation code record.
    UPDATE public.activation_codes
    SET 
        is_used = TRUE,
        used_by = p_user_id,
        used_at = now()
    WHERE id = v_code_id;

    -- Update the user's profile to 'Pro'.
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = p_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ALTER FUNCTION activate_account_with_code(text, uuid) OWNER TO postgres;



-- This function will be called by the admin to delete a user.
-- It deletes from auth.users, and the trigger on_user_deleted will clean up the profile.
-- Note: This requires the 'supabase_admin' role which server-side clients have.
-- We are not creating this function anymore as it's handled by the server action with admin client.

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
