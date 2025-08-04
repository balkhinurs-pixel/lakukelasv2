-- Panduan:
-- 1. Buka Supabase Studio Anda.
-- 2. Navigasi ke "SQL Editor".
-- 3. Klik "+ New query".
-- 4. Salin semua isi file ini dan tempel ke editor.
-- 5. Klik "RUN".

-- Ekstensi untuk UUID (jika belum aktif)
create extension if not exists "uuid-ossp";

-- 1. Tabel PROFILES
-- Tabel ini menyimpan data publik pengguna (guru) dan terhubung dengan tabel auth.users bawaan Supabase.
create table public.profiles (
  id uuid not null primary key, -- Referensi ke auth.users.id
  email text,
  full_name text,
  nip text,
  pangkat text,
  jabatan text,
  avatar_url text,
  updated_at timestamp with time zone,

  constraint fk_auth foreign key (id) references auth.users (id) on delete cascade
);

comment on table public.profiles is 'Menyimpan data profil publik untuk setiap pengguna.';
comment on column public.profiles.id is 'Referensi ke ID pengguna di tabel auth.users.';

-- 2. Tabel SUBSCRIPTIONS
-- Menyimpan status dan detail langganan setiap pengguna.
create table public.subscriptions (
  id uuid not null primary key, -- Referensi ke profiles.id
  status text default 'free'::text, -- 'free' atau 'premium'
  plan_name text default 'Free'::text, -- 'Free', 'Semester', atau 'Tahunan'
  expires_at timestamp with time zone,

  constraint fk_profile foreign key (id) references public.profiles(id) on delete cascade
);

comment on table public.subscriptions is 'Menyimpan status langganan untuk setiap pengguna.';

-- 3. Tabel COUPONS
-- Menyimpan data kupon diskon yang bisa dibuat oleh admin.
create type coupon_type as enum ('Persen', 'Tetap');
create type coupon_status as enum ('Aktif', 'Tidak Aktif', 'Kadaluarsa');

create table public.coupons (
  id uuid not null default uuid_generate_v4() primary key,
  code text not null unique,
  type coupon_type not null,
  value numeric not null,
  usage_limit integer not null,
  usage_count integer default 0,
  status coupon_status default 'Aktif'::coupon_status,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

comment on table public.coupons is 'Menyimpan kode kupon diskon untuk promosi.';

-- 4. Tabel SCHOOL_SETTINGS
-- Menyimpan data sekolah yang dimiliki oleh seorang guru/pengguna.
create table public.school_settings (
  id uuid not null default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_name text,
  school_address text,
  headmaster_name text,
  headmaster_nip text,
  logo_url text,
  updated_at timestamp with time zone default now()
);

comment on table public.school_settings is 'Menyimpan data dan pengaturan sekolah untuk setiap guru.';

-- Security: Enable Row Level Security (RLS)
-- Sangat PENTING untuk keamanan data Anda.
-- Aturan di bawah ini adalah contoh dasar, Anda perlu menyesuaikannya sesuai kebutuhan aplikasi.

-- PROFILES
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on public.profiles for update using (auth.uid() = id);

-- SUBSCRIPTIONS
alter table public.subscriptions enable row level security;
create policy "Users can view their own subscription." on public.subscriptions for select using (auth.uid() = id);
-- Admin-only policies for update/insert would be handled via server-side logic (Edge Functions).

-- COUPONS
alter table public.coupons enable row level security;
create policy "Coupons are public to view." on public.coupons for select using (true);
-- Admin-only policies for create/update/delete would be handled via server-side logic (Edge Functions).

-- SCHOOL_SETTINGS
alter table public.school_settings enable row level security;
create policy "Users can view their own school settings." on public.school_settings for select using (auth.uid() = user_id);
create policy "Users can insert their own school settings." on public.school_settings for insert with check (auth.uid() = user_id);
create policy "Users can update their own school settings." on public.school_settings for update using (auth.uid() = user_id);

-- Catatan:
-- Tabel untuk data akademik seperti `classes`, `students`, `journal_entries`, `attendance` belum dibuat
-- karena akan lebih kompleks dan biasanya terikat pada 'tahun ajaran' yang aktif.
-- Struktur tersebut bisa ditambahkan kemudian sesuai dengan evolusi aplikasi.
