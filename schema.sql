
-- Enable RLS
alter table profiles enable row level security;
alter table classes enable row level security;
alter table subjects enable row level security;
alter table students enable row level security;
alter table schedule enable row level security;
alter table attendance_history enable row level security;
alter table grade_history enable row level security;
alter table journals enable row level security;
alter table school_years enable row level security;
alter table agendas enable row level security;
alter table activation_codes enable row level security;

-- Create Policies

-- Profiles
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Classes, Subjects, Students, Schedule, History, Journals, School Years, Agendas
create policy "Users can view their own data." on classes for select using (auth.uid() = teacher_id);
create policy "Users can insert their own data." on classes for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own data." on classes for update using (auth.uid() = teacher_id);
create policy "Users can delete their own data." on classes for delete using (auth.uid() = teacher_id);

create policy "Users can view their own data." on subjects for select using (auth.uid() = teacher_id);
create policy "Users can insert their own data." on subjects for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own data." on subjects for update using (auth.uid() = teacher_id);
create policy "Users can delete their own data." on subjects for delete using (auth.uid() = teacher_id);

create policy "Users can view their own students." on students for select using (auth.uid() = (select teacher_id from classes where id = class_id));
create policy "Users can insert their own students." on students for insert with check (auth.uid() = (select teacher_id from classes where id = class_id));
create policy "Users can update their own students." on students for update using (auth.uid() = (select teacher_id from classes where id = class_id));
create policy "Users can delete their own students." on students for delete using (auth.uid() = (select teacher_id from classes where id = class_id));

create policy "Users can view their own data." on schedule for select using (auth.uid() = teacher_id);
create policy "Users can insert their own data." on schedule for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own data." on schedule for update using (auth.uid() = teacher_id);
create policy "Users can delete their own data." on schedule for delete using (auth.uid() = teacher_id);

create policy "Users can view their own data." on attendance_history for select using (auth.uid() = teacher_id);
create policy "Users can insert their own data." on attendance_history for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own data." on attendance_history for update using (auth.uid() = teacher_id);
create policy "Users can delete their own data." on attendance_history for delete using (auth.uid() = teacher_id);

create policy "Users can view their own data." on grade_history for select using (auth.uid() = teacher_id);
create policy "Users can insert their own data." on grade_history for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own data." on grade_history for update using (auth.uid() = teacher_id);
create policy "Users can delete their own data." on grade_history for delete using (auth.uid() = teacher_id);

create policy "Users can view their own data." on journals for select using (auth.uid() = teacher_id);
create policy "Users can insert their own data." on journals for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own data." on journals for update using (auth.uid() = teacher_id);
create policy "Users can delete their own data." on journals for delete using (auth.uid() = teacher_id);

create policy "Users can view their own data." on school_years for select using (auth.uid() = teacher_id);
create policy "Users can insert their own data." on school_years for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own data." on school_years for update using (auth.uid() = teacher_id);
create policy "Users can delete their own data." on school_years for delete using (auth.uid() = teacher_id);

create policy "Users can view their own data." on agendas for select using (auth.uid() = teacher_id);
create policy "Users can insert their own data." on agendas for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own data." on agendas for update using (auth.uid() = teacher_id);
create policy "Users can delete their own data." on agendas for delete using (auth.uid() = teacher_id);

-- Activation Codes (Admin only)
create policy "Admins can manage activation codes." on activation_codes for all
    using ( (select role from profiles where id = auth.uid()) = 'admin' )
    with check ( (select role from profiles where id = auth.uid()) = 'admin' );
    

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
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
$$;

-- Trigger to call the function on new user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Function to handle user deletion
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

-- Trigger for user deletion
create or replace trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.handle_user_delete();

-- RPC function for account activation
create or replace function activate_account_with_code(activation_code_to_use text, user_id_to_activate uuid, user_email_to_set text)
returns void
language plpgsql
as $$
declare
  code_id_to_use uuid;
begin
  -- Find the code and lock it
  select id into code_id_to_use from public.activation_codes where code = activation_code_to_use and is_used = false for update;

  -- If code is not found or already used, raise an exception
  if code_id_to_use is null then
    raise exception 'Code not found or already used';
  end if;

  -- Update the activation_codes table
  update public.activation_codes
  set 
    is_used = true,
    used_by = user_id_to_activate,
    used_at = now(),
    used_by_email = user_email_to_set
  where id = code_id_to_use;

  -- Update the profiles table
  update public.profiles
  set account_status = 'Pro'
  where id = user_id_to_activate;
end;
$$;


-- RPC function to add a student, checking for existing NIS for the same teacher
create or replace function add_student_with_teacher_check(p_class_id uuid, p_nis text, p_name text, p_gender text)
returns void as $$
declare
  v_teacher_id uuid;
  v_nis_exists boolean;
begin
  -- Get the teacher_id from the provided p_class_id
  select teacher_id into v_teacher_id
  from public.classes
  where id = p_class_id;

  -- Check if the current user is the owner of the class
  if v_teacher_id is null or v_teacher_id != auth.uid() then
    raise exception 'User is not authorized to add students to this class.';
  end if;

  -- Check if a student with the same NIS already exists for this teacher across all their classes
  select exists (
    select 1
    from public.students s
    join public.classes c on s.class_id = c.id
    where s.nis = p_nis
    and c.teacher_id = v_teacher_id
  ) into v_nis_exists;

  if v_nis_exists then
    raise exception 'A student with this NIS already exists for this teacher.';
  end if;

  -- If checks pass, insert the new student
  insert into public.students (name, nis, gender, class_id, status)
  values (p_name, p_nis, p_gender, p_class_id, 'active');
end;
$$ language plpgsql;
