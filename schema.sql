
-- ---
-- Enable RLS
-- ---
alter table "public"."profiles" enable row level security;
alter table "public"."classes" enable row level security;
alter table "public"."subjects" enable row level security;
alter table "public"."students" enable row level security;
alter table "public"."schedule" enable row level security;
alter table "public"."journals" enable row level security;
alter table "public"."attendance_history" enable row level security;
alter table "public"."grade_history" enable row level security;
alter table "public"."activation_codes" enable row level security;

-- ---
-- Functions
-- ---

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
drop function if exists public.handle_new_user();
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'teacher');
  return new;
end;
$$;


-- ---
-- Triggers
-- ---
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ---
-- Policies
-- ---

-- Policies for profiles
-- 1. Users can view their own profile.
drop policy if exists "Users can view their own profile." on public.profiles;
create policy "Users can view their own profile."
  on public.profiles for select
  using ( auth.uid() = id );

-- 2. Users can update their own profile.
drop policy if exists "Users can update their own profile." on public.profiles;
create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );
  
-- 3. Admins can view all profiles.
drop policy if exists "Admins can view all profiles." on public.profiles;
create policy "Admins can view all profiles."
  on public.profiles for select
  using ( (select role from public.profiles where id = auth.uid()) = 'admin' );


-- Policies for classes, subjects, students, schedule, journals, attendance, grades
-- 1. Users can select their own data.
drop policy if exists "Users can select their own data." on public.classes;
create policy "Users can select their own data." on public.classes for select using (auth.uid() = teacher_id);
drop policy if exists "Users can select their own data." on public.subjects;
create policy "Users can select their own data." on public.subjects for select using (auth.uid() = teacher_id);
drop policy if exists "Users can select their own data." on public.schedule;
create policy "Users can select their own data." on public.schedule for select using (auth.uid() = teacher_id);
drop policy if exists "Users can select their own data." on public.journals;
create policy "Users can select their own data." on public.journals for select using (auth.uid() = teacher_id);
drop policy if exists "Users can select their own data." on public.attendance_history;
create policy "Users can select their own data." on public.attendance_history for select using (auth.uid() = teacher_id);
drop policy if exists "Users can select their own data." on public.grade_history;
create policy "Users can select their own data." on public.grade_history for select using (auth.uid() = teacher_id);

-- 2. Users can insert their own data.
drop policy if exists "Users can insert their own data." on public.classes;
create policy "Users can insert their own data." on public.classes for insert with check (auth.uid() = teacher_id);
drop policy if exists "Users can insert their own data." on public.subjects;
create policy "Users can insert their own data." on public.subjects for insert with check (auth.uid() = teacher_id);
drop policy if exists "Users can insert their own data." on public.schedule;
create policy "Users can insert their own data." on public.schedule for insert with check (auth.uid() = teacher_id);
drop policy if exists "Users can insert their own data." on public.journals;
create policy "Users can insert their own data." on public.journals for insert with check (auth.uid() = teacher_id);
drop policy if exists "Users can insert their own data." on public.attendance_history;
create policy "Users can insert their own data." on public.attendance_history for insert with check (auth.uid() = teacher_id);
drop policy if exists "Users can insert their own data." on public.grade_history;
create policy "Users can insert their own data." on public.grade_history for insert with check (auth.uid() = teacher_id);

-- 3. Users can update their own data.
drop policy if exists "Users can update their own data." on public.classes;
create policy "Users can update their own data." on public.classes for update using (auth.uid() = teacher_id);
drop policy if exists "Users can update their own data." on public.subjects;
create policy "Users can update their own data." on public.subjects for update using (auth.uid() = teacher_id);
drop policy if exists "Users can update their own data." on public.schedule;
create policy "Users can update their own data." on public.schedule for update using (auth.uid() = teacher_id);
drop policy if exists "Users can update their own data." on public.journals;
create policy "Users can update their own data." on public.journals for update using (auth.uid() = teacher_id);
drop policy if exists "Users can update their own data." on public.attendance_history;
create policy "Users can update their own data." on public.attendance_history for update using (auth.uid() = teacher_id);
drop policy if exists "Users can update their own data." on public.grade_history;
create policy "Users can update their own data." on public.grade_history for update using (auth.uid() = teacher_id);

-- 4. Users can delete their own data.
drop policy if exists "Users can delete their own data." on public.classes;
create policy "Users can delete their own data." on public.classes for delete using (auth.uid() = teacher_id);
drop policy if exists "Users can delete their own data." on public.subjects;
create policy "Users can delete their own data." on public.subjects for delete using (auth.uid() = teacher_id);
drop policy if exists "Users can delete their own data." on public.schedule;
create policy "Users can delete their own data." on public.schedule for delete using (auth.uid() = teacher_id);
drop policy if exists "Users can delete their own data." on public.journals;
create policy "Users can delete their own data." on public.journals for delete using (auth.uid() = teacher_id);
drop policy if exists "Users can delete their own data." on public.attendance_history;
create policy "Users can delete their own data." on public.attendance_history for delete using (auth.uid() = teacher_id);
drop policy if exists "Users can delete their own data." on public.grade_history;
create policy "Users can delete their own data." on public.grade_history for delete using (auth.uid() = teacher_id);


-- Policies for students
-- 1. Teachers can select students from their own classes.
drop policy if exists "Teachers can view students in their classes." on public.students;
create policy "Teachers can view students in their classes."
  on public.students for select
  using (
    exists (
      select 1 from classes
      where classes.id = students.class_id and classes.teacher_id = auth.uid()
    )
  );

-- 2. Teachers can insert students into their own classes.
drop policy if exists "Teachers can insert students into their classes." on public.students;
create policy "Teachers can insert students into their classes."
  on public.students for insert
  with check (
    exists (
      select 1 from classes
      where classes.id = students.class_id and classes.teacher_id = auth.uid()
    )
  );

-- 3. Teachers can update students in their own classes.
drop policy if exists "Teachers can update students in their classes." on public.students;
create policy "Teachers can update students in their classes."
  on public.students for update
  using (
    exists (
      select 1 from classes
      where classes.id = students.class_id and classes.teacher_id = auth.uid()
    )
  );
  
-- 4. Teachers can delete students from their own classes.
drop policy if exists "Teachers can delete students from their classes." on public.students;
create policy "Teachers can delete students from their classes."
  on public.students for delete
  using (
    exists (
      select 1 from classes
      where classes.id = students.class_id and classes.teacher_id = auth.uid()
    )
  );

-- Policies for activation_codes
-- 1. Admins can manage activation codes
drop policy if exists "Admins can manage activation codes." on public.activation_codes;
create policy "Admins can manage activation codes."
    on public.activation_codes for all
    using ( (select role from public.profiles where id = auth.uid()) = 'admin' );

-- 2. Authenticated users can read activation codes (to check them)
drop policy if exists "Authenticated users can read codes." on public.activation_codes;
create policy "Authenticated users can read codes."
    on public.activation_codes for select
    using ( auth.role() = 'authenticated' );
