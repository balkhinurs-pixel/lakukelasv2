
-- Enable RLS
alter table "public"."profiles" enable row level security;
alter table "public"."classes" enable row level security;
alter table "public"."subjects" enable row level security;
alter table "public"."students" enable row level security;
alter table "public"."schedule" enable row level security;
alter table "public"."journals" enable row level security;
alter table "public"."attendance_history" enable row level security;
alter table "public"."grade_history" enable row level security;
alter table "public"."activation_codes" enable row level security;
alter table "public"."school_years" enable row level security;

-- Create users profile function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to run the function when a new user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a function to delete a user's profile when the user is deleted
create or replace function public.handle_delete_user()
returns trigger as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$ language plpgsql security definer;

-- Create a trigger to run the function when a user is deleted
drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  before delete on auth.users
  for each row execute procedure public.handle_delete_user();

-- Create activation function
create or replace function public.activate_account_with_code(activation_code_to_use text, user_id_to_activate uuid, user_email_to_set text)
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

  if code_is_used then
    raise exception 'Code already used';
  end if;

  -- Update the activation_codes table
  update public.activation_codes
  set
    is_used = true,
    used_by = user_id_to_activate,
    used_at = now(),
    used_by_email = user_email_to_set
  where id = code_id;

  -- Update the profiles table
  update public.profiles
  set account_status = 'Pro'
  where id = user_id_to_activate;
end;
$$ language plpgsql security definer;

-- RLS Policies
drop policy if exists "Enable read access for all users" on "public"."profiles";
create policy "Enable read access for all users" on "public"."profiles"
as permissive for select
to public
using (true);

drop policy if exists "Users can insert their own profile" on "public"."profiles";
create policy "Users can insert their own profile" on "public"."profiles"
as permissive for insert
to public
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on "public"."profiles";
create policy "Users can update their own profile" on "public"."profiles"
as permissive for update
to public
using (auth.uid() = id);

drop policy if exists "Enable read access for own data" on "public"."classes";
create policy "Enable read access for own data" on "public"."classes"
as permissive for select
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable insert for own data" on "public"."classes";
create policy "Enable insert for own data" on "public"."classes"
as permissive for insert
to authenticated
with check (auth.uid() = teacher_id);

drop policy if exists "Enable update for own data" on "public"."classes";
create policy "Enable update for own data" on "public"."classes"
as permissive for update
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable delete for own data" on "public"."classes";
create policy "Enable delete for own data" on "public"."classes"
as permissive for delete
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable read access for own data" on "public"."subjects";
create policy "Enable read access for own data" on "public"."subjects"
as permissive for select
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable insert for own data" on "public"."subjects";
create policy "Enable insert for own data" on "public"."subjects"
as permissive for insert
to authenticated
with check (auth.uid() = teacher_id);

drop policy if exists "Enable update for own data" on "public"."subjects";
create policy "Enable update for own data" on "public"."subjects"
as permissive for update
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable delete for own data" on "public"."subjects";
create policy "Enable delete for own data" on "public"."subjects"
as permissive for delete
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable read access for own students" on "public"."students";
create policy "Enable read access for own students" on "public"."students"
as permissive for select
to authenticated
using (
  exists (
    select 1 from classes
    where classes.id = students.class_id and classes.teacher_id = auth.uid()
  )
);

drop policy if exists "Enable insert for own students" on "public"."students";
create policy "Enable insert for own students" on "public"."students"
as permissive for insert
to authenticated
with check (
  exists (
    select 1 from classes
    where classes.id = students.class_id and classes.teacher_id = auth.uid()
  )
);

drop policy if exists "Enable update for own students" on "public"."students";
create policy "Enable update for own students" on "public"."students"
as permissive for update
to authenticated
using (
  exists (
    select 1 from classes
    where classes.id = students.class_id and classes.teacher_id = auth.uid()
  )
);

drop policy if exists "Enable delete for own students" on "public"."students";
create policy "Enable delete for own students" on "public"."students"
as permissive for delete
to authenticated
using (
  exists (
    select 1 from classes
    where classes.id = students.class_id and classes.teacher_id = auth.uid()
  )
);

drop policy if exists "Enable read access for own data" on "public"."schedule";
create policy "Enable read access for own data" on "public"."schedule"
as permissive for select
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable insert for own data" on "public"."schedule";
create policy "Enable insert for own data" on "public"."schedule"
as permissive for insert
to authenticated
with check (auth.uid() = teacher_id);

drop policy if exists "Enable update for own data" on "public"."schedule";
create policy "Enable update for own data" on "public"."schedule"
as permissive for update
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable delete for own data" on "public"."schedule";
create policy "Enable delete for own data" on "public"."schedule"
as permissive for delete
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable read access for own data" on "public"."journals";
create policy "Enable read access for own data" on "public"."journals"
as permissive for select
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable insert for own data" on "public"."journals";
create policy "Enable insert for own data" on "public"."journals"
as permissive for insert
to authenticated
with check (auth.uid() = teacher_id);

drop policy if exists "Enable update for own data" on "public"."journals";
create policy "Enable update for own data" on "public"."journals"
as permissive for update
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable delete for own data" on "public"."journals";
create policy "Enable delete for own data" on "public"."journals"
as permissive for delete
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable read access for own data" on "public"."attendance_history";
create policy "Enable read access for own data" on "public"."attendance_history"
as permissive for select
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable insert for own data" on "public"."attendance_history";
create policy "Enable insert for own data" on "public"."attendance_history"
as permissive for insert
to authenticated
with check (auth.uid() = teacher_id);

drop policy if exists "Enable update for own data" on "public"."attendance_history";
create policy "Enable update for own data" on "public"."attendance_history"
as permissive for update
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable delete for own data" on "public"."attendance_history";
create policy "Enable delete for own data" on "public"."attendance_history"
as permissive for delete
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable read access for own data" on "public"."grade_history";
create policy "Enable read access for own data" on "public"."grade_history"
as permissive for select
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable insert for own data" on "public"."grade_history";
create policy "Enable insert for own data" on "public"."grade_history"
as permissive for insert
to authenticated
with check (auth.uid() = teacher_id);

drop policy if exists "Enable update for own data" on "public"."grade_history";
create policy "Enable update for own data" on "public"."grade_history"
as permissive for update
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable delete for own data" on "public"."grade_history";
create policy "Enable delete for own data" on "public"."grade_history"
as permissive for delete
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable read access for own data" on "public"."school_years";
create policy "Enable read access for own data" on "public"."school_years"
as permissive for select
to authenticated
using (auth.uid() = teacher_id);

drop policy if exists "Enable insert for own data" on "public"."school_years";
create policy "Enable insert for own data" on "public"."school_years"
as permissive for insert
to authenticated
with check (auth.uid() = teacher_id);

drop policy if exists "Enable all access for admin" on "public"."activation_codes";
create policy "Enable all access for admin" on "public"."activation_codes"
as permissive for all
to public
using ((select role from profiles where id = auth.uid()) = 'admin')
with check ((select role from profiles where id = auth.uid()) = 'admin');

drop policy if exists "Allow authenticated users to read codes" on "public"."activation_codes";
create policy "Allow authenticated users to read codes" on "public"."activation_codes"
as permissive for select
to authenticated
using (true);

-- Storage bucket and policies
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

drop policy if exists "Allow public read access" on storage.objects;
create policy "Allow public read access"
on storage.objects for select
to public
using ( bucket_id = 'profile-images' );

drop policy if exists "Allow authenticated users to upload" on storage.objects;
create policy "Allow authenticated users to upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'profile-images' and auth.uid() = owner );

drop policy if exists "Allow authenticated users to update their own files" on storage.objects;
create policy "Allow authenticated users to update their own files"
on storage.objects for update
to authenticated
using ( auth.uid() = owner );
