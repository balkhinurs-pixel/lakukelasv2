
-- ### Lakukelas Supabase Schema ###
-- Versi: 1.1.0
-- Deskripsi: Skema ini mendefinisikan tabel-tabel inti untuk aplikasi Lakukelas,
--            termasuk manajemen pengguna, rombongan belajar (kelas, siswa, mapel),
--            dan data transaksional (presensi, nilai, jurnal).
--            Ditambahkan tabel untuk aktivasi akun.

-- ----------------------------------------------------------------
-- 1. AKTIFKAN UUID EXTENSION
-- ----------------------------------------------------------------
create extension if not exists "uuid-ossp" with schema "extensions";

-- ----------------------------------------------------------------
-- 2. TABEL PENGGUNA (USERS & PROFILES)
-- ----------------------------------------------------------------
-- Tabel `users` dibuat secara otomatis oleh Supabase Auth.
-- Tabel `profiles` ini akan menyimpan data tambahan terkait pengguna (guru).
-- Ini terhubung ke tabel `auth.users` melalui foreign key.

create table if not exists "public"."profiles" (
    "id" "uuid" not null,
    "full_name" "text",
    "avatar_url" "text",
    "nip" "text",
    "pangkat" "text",
    "jabatan" "text",
    "school_name" "text",
    "school_address" "text",
    "headmaster_name" "text",
    "headmaster_nip" "text",
    "school_logo_url" "text",
    "account_status" "text" default 'Free'::text,
    "updated_at" timestamp with time zone,
    primary key ("id"),
    foreign key ("id") references "auth"."users" ("id") on delete cascade
);

-- Kebijakan Akses (RLS) untuk `profiles`
alter table "public"."profiles" enable row level security;
-- Pengguna hanya bisa melihat profil mereka sendiri.
create policy "Users can view their own profile." on "public"."profiles" for select using (("auth"."uid"() = "id"));
-- Pengguna hanya bisa memperbarui profil mereka sendiri.
create policy "Users can update their own profile." on "public"."profiles" for update using (("auth"."uid"() = "id"));

-- Fungsi Trigger untuk sinkronisasi data dari `auth.users` ke `profiles`
-- Setiap kali ada pengguna baru di `auth.users`, otomatis buatkan entri di `profiles`.
create or replace function "public"."handle_new_user"()
returns "trigger"
language "plpgsql"
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, account_status)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'Free');
  return new;
end;
$$;

-- Terapkan trigger ke tabel `auth.users`
create trigger "on_auth_user_created"
after insert on "auth"."users"
for each row execute procedure "public"."handle_new_user"();


-- ----------------------------------------------------------------
-- 3. TABEL AKTIVASI
-- ----------------------------------------------------------------
-- Tabel untuk menyimpan kode aktivasi akun Pro
create table if not exists "public"."activation_codes" (
    "id" "uuid" not null default "uuid_generate_v4"(),
    "code" "text" not null,
    "is_used" boolean not null default false,
    "created_at" timestamp with time zone default "now"(),
    "used_at" timestamp with time zone,
    "used_by" "uuid",
    primary key ("id"),
    unique ("code"),
    foreign key ("used_by") references "auth"."users" ("id") on delete set null
);

-- Kebijakan Akses (RLS) untuk `activation_codes`
alter table "public"."activation_codes" enable row level security;
-- Admin (atau peran yang ditunjuk) harus bisa mengelola kode ini.
-- Untuk saat ini, kita biarkan RLS lebih permisif dari sisi server (menggunakan service_role key)
-- dan membatasi akses dari sisi klien.
-- Pengguna terautentikasi bisa membaca kode untuk validasi.
create policy "Authenticated users can select codes" on "public"."activation_codes" for select to authenticated using (true);
-- Service role (backend) bisa melakukan semua operasi.
create policy "Allow full access to service_role" on "public"."activation_codes" for all to service_role using (true);


-- ----------------------------------------------------------------
-- 4. TABEL ROMBONGAN BELAJAR (ROMBEL)
-- ----------------------------------------------------------------

-- Tabel `classes` untuk menyimpan data kelas
create table if not exists "public"."classes" (
    "id" "uuid" not null default "uuid_generate_v4"(),
    "name" "text" not null,
    "teacher_id" "uuid" not null,
    "created_at" timestamp with time zone default "now"(),
    primary key ("id"),
    foreign key ("teacher_id") references "auth"."users" ("id") on delete cascade
);
alter table "public"."classes" enable row level security;
create policy "Users can manage their own classes" on "public"."classes" for all using (("auth"."uid"() = "teacher_id"));

-- Tabel `subjects` untuk menyimpan data mata pelajaran
create table if not exists "public"."subjects" (
    "id" "uuid" not null default "uuid_generate_v4"(),
    "name" "text" not null,
    "kkm" smallint not null default 75,
    "teacher_id" "uuid" not null,
    "created_at" timestamp with time zone default "now"(),
    primary key ("id"),
    foreign key ("teacher_id") references "auth"."users" ("id") on delete cascade
);
alter table "public"."subjects" enable row level security;
create policy "Users can manage their own subjects" on "public"."subjects" for all using (("auth"."uid"() = "teacher_id"));

-- Tabel `students` untuk menyimpan data siswa
create table if not exists "public"."students" (
    "id" "uuid" not null default "uuid_generate_v4"(),
    "name" "text" not null,
    "nis" "text",
    "nisn" "text",
    "gender" "text",
    "class_id" "uuid" not null,
    "created_at" timestamp with time zone default "now"(),
    primary key ("id"),
    foreign key ("class_id") references "public"."classes" ("id") on delete cascade
);
alter table "public"."students" enable row level security;
-- Siswa bisa dikelola jika guru adalah pemilik kelasnya.
create policy "Teachers can manage students in their classes" on "public"."students" for all using (
    exists (
        select 1 from classes
        where classes.id = students.class_id and classes.teacher_id = auth.uid()
    )
);

-- ----------------------------------------------------------------
-- 5. TABEL JADWAL
-- ----------------------------------------------------------------
create table if not exists "public"."schedule" (
    "id" "uuid" not null default "uuid_generate_v4"(),
    "day" "text" not null,
    "start_time" "time" not null,
    "end_time" "time" not null,
    "subject_id" "uuid" not null,
    "class_id" "uuid" not null,
    "teacher_id" "uuid" not null,
    "created_at" timestamp with time zone default "now"(),
    primary key ("id"),
    foreign key ("subject_id") references "public"."subjects" ("id") on delete cascade,
    foreign key ("class_id") references "public"."classes" ("id") on delete cascade,
    foreign key ("teacher_id") references "auth"."users" ("id") on delete cascade
);
alter table "public"."schedule" enable row level security;
create policy "Users can manage their own schedule" on "public"."schedule" for all using (("auth"."uid"() = "teacher_id"));

-- ----------------------------------------------------------------
-- 6. TABEL TRANSAKSIONAL (PRESENSI, NILAI, JURNAL)
-- ----------------------------------------------------------------

-- Tabel `attendance_history` untuk menyimpan rekaman presensi
create table if not exists "public"."attendance_history" (
    "id" "uuid" not null default "uuid_generate_v4"(),
    "date" "date" not null,
    "class_id" "uuid" not null,
    "subject_id" "uuid" not null,
    "meeting_number" "integer",
    "records" "jsonb", -- Format: [{"studentId": "uuid", "status": "Hadir"}]
    "created_at" timestamp with time zone default "now"(),
    primary key ("id"),
    foreign key ("class_id") references "public"."classes" ("id") on delete cascade,
    foreign key ("subject_id") references "public"."subjects" ("id") on delete cascade
);
alter table "public"."attendance_history" enable row level security;
-- Guru bisa mengelola presensi di kelas yang mereka ajar
create policy "Teachers can manage attendance in their classes" on "public"."attendance_history" for all using (
    exists (
        select 1 from classes
        where classes.id = attendance_history.class_id and classes.teacher_id = auth.uid()
    )
);

-- Tabel `grade_history` untuk menyimpan rekaman nilai
create table if not exists "public"."grade_history" (
    "id" "uuid" not null default "uuid_generate_v4"(),
    "date" "date" not null,
    "class_id" "uuid" not null,
    "subject_id" "uuid" not null,
    "assessment_type" "text" not null,
    "records" "jsonb", -- Format: [{"studentId": "uuid", "score": 95}]
    "created_at" timestamp with time zone default "now"(),
    primary key ("id"),
    foreign key ("class_id") references "public"."classes" ("id") on delete cascade,
    foreign key ("subject_id") references "public"."subjects" ("id") on delete cascade
);
alter table "public"."grade_history" enable row level security;
create policy "Teachers can manage grades in their classes" on "public"."grade_history" for all using (
    exists (
        select 1 from classes
        where classes.id = grade_history.class_id and classes.teacher_id = auth.uid()
    )
);

-- Tabel `journals` untuk menyimpan jurnal mengajar
create table if not exists "public"."journals" (
    "id" "uuid" not null default "uuid_generate_v4"(),
    "date" "date" not null default "now"(),
    "class_id" "uuid" not null,
    "subject_id" "uuid" not null,
    "teacher_id" "uuid" not null,
    "meeting_number" "integer",
    "learning_objectives" "text",
    "learning_activities" "text",
    "assessment" "text",
    "reflection" "text",
    "created_at" timestamp with time zone default "now"(),
    primary key ("id"),
    foreign key ("class_id") references "public"."classes" ("id") on delete cascade,
    foreign key ("subject_id") references "public"."subjects" ("id") on delete cascade,
    foreign key ("teacher_id") references "auth"."users" ("id") on delete cascade
);
alter table "public"."journals" enable row level security;
create policy "Users can manage their own journals" on "public"."journals" for all using (("auth"."uid"() = "teacher_id"));


-- Tambahkan beberapa kode aktivasi contoh (OPSIONAL, hanya untuk development)
-- Anda bisa menjalankan ini secara manual di SQL Editor Supabase Anda
-- INSERT INTO public.activation_codes (code) VALUES
-- ('LAKUKELAS-PRO-2024'),
-- ('TEACHER-SPECIAL-CODE'),
-- ('ZEPHYRPRO2024');
