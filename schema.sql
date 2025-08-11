
-- ### PROFILES ###
-- Tabel ini menyimpan data publik untuk setiap pengguna.
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
    constraint profiles_id_fkey foreign key (id) references auth.users (id) on update cascade on delete cascade,
    constraint profiles_active_school_year_id_fkey foreign key (active_school_year_id) references school_years (id) on delete set null
  );

-- Aktifkan Row Level Security (RLS) untuk tabel profiles.
alter table public.profiles enable row level security;

-- Kebijakan: Pengguna dapat melihat semua profil (berguna untuk data publik).
create policy "Public profiles are viewable by everyone." on public.profiles for
select
  using (true);

-- Kebijakan: Pengguna hanya dapat mengubah profil mereka sendiri.
create policy "Users can insert their own profile." on public.profiles for
insert
  with check (auth.uid () = id);

create policy "Users can update own profile." on public.profiles for
update
  using (auth.uid () = id);

-- ### FUNCTION: handle_new_user ###
-- Fungsi ini secara otomatis membuat profil baru ketika ada pengguna baru yang mendaftar di Supabase Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    'teacher' -- Semua pengguna baru defaultnya adalah 'teacher'
  );
  return new;
end;
$$;

-- ### TRIGGER: on_auth_user_created ###
-- Trigger yang memanggil fungsi handle_new_user setiap kali ada pengguna baru.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ### FUNCTION: on_delete_user ###
-- Fungsi ini akan dijalankan saat admin menghapus user via Supabase dashboard
create function public.on_delete_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    -- Menghapus profil yang terkait
    delete from public.profiles where id = old.id;
    return old;
end;
$$;

-- ### TRIGGER: on_auth_user_deleted ###
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.on_delete_user();


-- ### STORAGE BUCKETS ###
-- Konfigurasi bucket penyimpanan untuk gambar profil.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-images', 'profile-images', true, 1048576, '{"image/jpeg","image/png","image/webp"}')
on conflict (id) do nothing;

-- Kebijakan: Izinkan semua pengguna yang terautentikasi untuk mengunggah gambar.
create policy "Allow authenticated users to upload images"
on storage.objects for insert to authenticated with check (
  bucket_id = 'profile-images'
);

-- Kebijakan: Izinkan semua pengguna yang terautentikasi untuk memperbarui gambar mereka sendiri.
create policy "Allow authenticated users to update their own images"
on storage.objects for update to authenticated with check (
  bucket_id = 'profile-images' and auth.uid() = owner
);

-- Kebijakan: Izinkan semua pengguna untuk melihat gambar.
create policy "Allow public read access to images"
on storage.objects for select using (
  bucket_id = 'profile-images'
);


-- ### CLASSES (Rombel) ###
create table
  public.classes (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    name text not null,
    teacher_id uuid not null,
    constraint classes_pkey primary key (id),
    constraint classes_teacher_id_fkey foreign key (teacher_id) references profiles (id) on update cascade on delete cascade
  );

alter table public.classes enable row level security;
create policy "Users can view their own classes." on public.classes for
select
  using (auth.uid () = teacher_id);
create policy "Users can insert their own classes." on public.classes for
insert
  with check (auth.uid () = teacher_id);
create policy "Users can update their own classes." on public.classes for
update
  using (auth.uid () = teacher_id);


-- ### SUBJECTS (Mata Pelajaran) ###
create table
  public.subjects (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    name text not null,
    kkm integer not null default 75,
    teacher_id uuid not null,
    constraint subjects_pkey primary key (id),
    constraint subjects_teacher_id_fkey foreign key (teacher_id) references profiles (id) on update cascade on delete cascade
  );

alter table public.subjects enable row level security;
create policy "Users can view their own subjects." on public.subjects for
select
  using (auth.uid () = teacher_id);
create policy "Users can insert their own subjects." on public.subjects for
insert
  with check (auth.uid () = teacher_id);
create policy "Users can update their own subjects." on public.subjects for
update
  using (auth.uid () = teacher_id);


-- ### STUDENTS (Siswa) ###
create table
  public.students (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    name text not null,
    nis text not null,
    nisn text not null,
    gender text not null,
    class_id uuid not null,
    constraint students_pkey primary key (id),
    constraint students_class_id_fkey foreign key (class_id) references classes (id) on update cascade on delete cascade
  );

alter table public.students enable row level security;
-- Untuk melihat siswa, pengguna harus menjadi pemilik kelas tempat siswa tersebut berada.
create policy "Users can view students in their classes." on public.students for
select
  using (
    exists (
      select
        1
      from
        classes
      where
        classes.id = students.class_id
        and classes.teacher_id = auth.uid ()
    )
  );
-- Untuk menambah siswa, pengguna harus menjadi pemilik kelas tujuan.
create policy "Users can insert students into their classes." on public.students for
insert
  with check (
    exists (
      select
        1
      from
        classes
      where
        classes.id = students.class_id
        and classes.teacher_id = auth.uid ()
    )
  );
-- Untuk mengubah data siswa, pengguna harus menjadi pemilik kelas siswa tersebut.
create policy "Users can update students in their classes." on public.students for
update
  using (
    exists (
      select
        1
      from
        classes
      where
        classes.id = students.class_id
        and classes.teacher_id = auth.uid ()
    )
  );


-- ### SCHOOL_YEARS (Tahun Ajaran) ###
create table
  public.school_years (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    name text not null,
    teacher_id uuid not null,
    constraint school_years_pkey primary key (id),
    constraint school_years_teacher_id_fkey foreign key (teacher_id) references profiles (id) on update cascade on delete cascade
  );

alter table public.school_years enable row level security;
create policy "Users can manage their own school years" on public.school_years for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);


-- ### JOURNALS (Jurnal Mengajar) ###
create table
  public.journals (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    date date not null,
    class_id uuid not null,
    subject_id uuid not null,
    meeting_number integer null,
    learning_objectives text not null,
    learning_activities text not null,
    assessment text null,
    reflection text null,
    teacher_id uuid not null,
    constraint journals_pkey primary key (id),
    constraint journals_class_id_fkey foreign key (class_id) references classes (id) on update cascade on delete cascade,
    constraint journals_subject_id_fkey foreign key (subject_id) references subjects (id) on update cascade on delete cascade,
    constraint journals_teacher_id_fkey foreign key (teacher_id) references profiles (id) on update cascade on delete cascade
  );

alter table public.journals enable row level security;
create policy "Users can manage their own journals" on public.journals for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);


-- ### SCHEDULE (Jadwal Pelajaran) ###
create table
  public.schedule (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    day text not null,
    start_time time without time zone not null,
    end_time time without time zone not null,
    class_id uuid not null,
    subject_id uuid not null,
    teacher_id uuid not null,
    constraint schedule_pkey primary key (id),
    constraint schedule_class_id_fkey foreign key (class_id) references classes (id) on update cascade on delete cascade,
    constraint schedule_subject_id_fkey foreign key (subject_id) references subjects (id) on update cascade on delete cascade,
    constraint schedule_teacher_id_fkey foreign key (teacher_id) references profiles (id) on update cascade on delete cascade
  );

alter table public.schedule enable row level security;
create policy "Users can manage their own schedule" on public.schedule for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);


-- ### ATTENDANCE_HISTORY (Riwayat Presensi) ###
create table
  public.attendance_history (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    date date not null,
    class_id uuid not null,
    subject_id uuid not null,
    meeting_number integer not null,
    records jsonb not null, -- Format: [{"student_id": "uuid", "status": "Hadir" | "Sakit" | "Izin" | "Alpha"}]
    teacher_id uuid not null,
    constraint attendance_history_pkey primary key (id),
    constraint attendance_history_class_id_fkey foreign key (class_id) references classes (id) on update cascade on delete cascade,
    constraint attendance_history_subject_id_fkey foreign key (subject_id) references subjects (id) on update cascade on delete cascade,
    constraint attendance_history_teacher_id_fkey foreign key (teacher_id) references profiles (id) on update cascade on delete cascade
  );

alter table public.attendance_history enable row level security;
create policy "Users can manage their own attendance history" on public.attendance_history for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);


-- ### GRADE_HISTORY (Riwayat Penilaian) ###
create table
  public.grade_history (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    date date not null,
    class_id uuid not null,
    subject_id uuid not null,
    assessment_type text not null,
    records jsonb not null, -- Format: [{"student_id": "uuid", "score": 85}]
    teacher_id uuid not null,
    constraint grade_history_pkey primary key (id),
    constraint grade_history_class_id_fkey foreign key (class_id) references classes (id) on update cascade on delete cascade,
    constraint grade_history_subject_id_fkey foreign key (subject_id) references subjects (id) on update cascade on delete cascade,
    constraint grade_history_teacher_id_fkey foreign key (teacher_id) references profiles (id) on update cascade on delete cascade
  );

alter table public.grade_history enable row level security;
create policy "Users can manage their own grade history" on public.grade_history for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- ### AGENDAS (Agenda Guru) ###
create table
  public.agendas (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    teacher_id uuid not null,
    date date not null,
    start_time time without time zone null,
    end_time time without time zone null,
    title text not null,
    description text null,
    tag text null,
    color text default '#6b7280',
    constraint agendas_pkey primary key (id),
    constraint agendas_teacher_id_fkey foreign key (teacher_id) references profiles (id) on update cascade on delete cascade
  );

alter table public.agendas enable row level security;
create policy "Users can manage their own agendas" on public.agendas for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);


-- ### ACTIVATION_CODES (Kode Aktivasi) ###
-- Hanya admin yang bisa mengelola ini, RLS dikelola di level API (server actions).
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
    constraint activation_codes_used_by_fkey foreign key (used_by) references profiles (id) on delete set null
  );

alter table public.activation_codes enable row level security;
-- Admin-only access is enforced through server-side checks, but we add basic RLS.
-- This allows admins to read all codes. No one else can.
create policy "Admins can view activation codes" on public.activation_codes for
select
  using (
    exists (
      select
        1
      from
        profiles
      where
        profiles.id = auth.uid () and profiles.role = 'admin'
    )
  );

-- Admin-only insert.
create policy "Admins can create activation codes" on public.activation_codes for
insert
  with check (
    exists (
      select
        1
      from
        profiles
      where
        profiles.id = auth.uid () and profiles.role = 'admin'
    )
  );


-- ### RPC FUNCTION: activate_account_with_code ###
-- Fungsi ini secara transaksional akan menggunakan kode dan mengupdate status akun user.
create or replace function public.activate_account_with_code(activation_code_to_use text, user_id_to_activate uuid, user_email_to_set text)
returns void as $$
declare
  code_id uuid;
  code_is_used boolean;
begin
  -- Cari kode dan kunci barisnya untuk update (FOR UPDATE)
  select id, is_used into code_id, code_is_used from public.activation_codes where code = activation_code_to_use for update;

  -- Jika kode tidak ditemukan, lemparkan error
  if code_id is null then
    raise exception 'Code not found';
  end if;

  -- Jika kode sudah digunakan, lemparkan error
  if code_is_used then
    raise exception 'Code already used';
  end if;

  -- Tandai kode sebagai sudah digunakan
  update public.activation_codes
  set
    is_used = true,
    used_by = user_id_to_activate,
    used_at = now()
  where id = code_id;

  -- Update status akun pengguna menjadi 'Pro'
  update public.profiles
  set account_status = 'Pro'
  where id = user_id_to_activate;
end;
$$ language plpgsql security definer;
