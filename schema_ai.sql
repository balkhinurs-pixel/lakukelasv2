
-- 1. Tambahkan kolom gemini_api_key ke tabel profiles jika belum ada
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='gemini_api_key') then
    alter table public.profiles add column gemini_api_key text;
  end if;
end $$;

-- 2. Tabel untuk menyimpan integrasi Google Drive per guru
create table if not exists public.google_drive_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google',
  drive_email text,
  folder_id text,
  folder_url text,
  folder_name text default 'LakuKelas AI',
  status text not null default 'connected',
  connected_at timestamptz default now(),
  disconnected_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- 3. Tabel untuk menyimpan metadata dokumen yang tersimpan di Drive
create table if not exists public.ai_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  title text not null,
  subject text,
  class_level text,
  semester text,
  drive_file_id text,
  drive_file_url text,
  drive_folder_id text,
  mime_type text,
  is_public boolean default false,
  status text default 'created',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Tabel utama Bank Soal (Questions)
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  generation_group_id uuid default gen_random_uuid(),
  
  jenjang text not null,
  kelas text not null,
  semester text,
  subject text not null,
  curriculum text,
  assessment_purpose text,
  topic text not null,
  subtopic text,

  sort_order int not null,
  question_type text not null,
  question_text text not null,
  options_json jsonb,
  correct_answer text,
  explanation text,
  
  difficulty text,
  cognitive_level text,
  language_direction text default 'ltr',
  image_url text,

  needs_review boolean default true,
  status text default 'draft',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Aktifkan RLS (Row Level Security)
alter table public.google_drive_integrations enable row level security;
alter table public.ai_documents enable row level security;
alter table public.questions enable row level security;

-- 6. Kebijakan Keamanan (Policies)

-- Google Drive Integrations
create policy "Users can manage own drive integration"
  on public.google_drive_integrations for all
  using (auth.uid() = user_id);

-- AI Documents
create policy "Users can manage own AI documents"
  on public.ai_documents for all
  using (auth.uid() = user_id);

-- Questions (Bank Soal)
create policy "Users can manage own questions"
  on public.questions for all
  using (auth.uid() = created_by);

-- 7. Grant access to authenticated users
grant all on public.google_drive_integrations to authenticated;
grant all on public.ai_documents to authenticated;
grant all on public.questions to authenticated;
