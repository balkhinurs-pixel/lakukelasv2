-- ==========================================
-- BLUEPRINT DATABASE: MODUL AI PEMBELAJARAN
-- VERSI: 18.1
-- FITUR: Bank Soal, Google Drive, AI Document
-- ==========================================

-- 1. TABEL QUESTIONS (BANK SOAL DIGITAL)
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  generation_group_id uuid, -- Mengelompokkan soal dari satu sesi generate
  
  -- Metadata Pendidikan
  jenjang text not null,
  kelas text not null,
  semester text,
  subject text not null,
  curriculum text,
  assessment_purpose text,
  topic text not null,
  subtopic text,
  
  -- Konten Soal
  sort_order int not null,
  question_type text not null, -- 'multiple_choice' atau 'essay'
  question_text text not null, -- Mendukung LaTeX
  options_json jsonb, -- Menyimpan opsi A-E
  correct_answer text,
  explanation text,
  
  -- Parameter AI
  difficulty text, -- 'mudah', 'sedang', 'sulit'
  cognitive_level text, -- C1-C6
  language_direction text default 'ltr',
  image_url text, -- Link ilustrasi dari Pollinations.ai
  
  -- Status
  status text default 'draft',
  needs_review boolean default true,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. TABEL INTEGRASI GOOGLE DRIVE
create table if not exists public.google_drive_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google',
  folder_id text, -- ID folder utama 'LakuKelas AI'
  folder_url text,
  folder_name text default 'LakuKelas AI',
  status text not null default 'connected',
  connected_at timestamptz default now(),
  disconnected_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- 3. TABEL RIWAYAT DOKUMEN (EKSPOR)
create table if not exists public.ai_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null, -- 'rpp', 'soal', 'lkpd'
  title text not null,
  drive_file_id text,
  drive_file_url text,
  drive_folder_id text,
  status text default 'created',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. MODIFIKASI TABEL PROFILES (API KEYS)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='gemini_api_key') then
    alter table public.profiles add column gemini_api_key text;
  end if;
end $$;

-- 5. KEAMANAN (ROW LEVEL SECURITY)
alter table public.questions enable row level security;
alter table public.google_drive_integrations enable row level security;
alter table public.ai_documents enable row level security;

-- 6. KEBIJAKAN AKSES (POLICIES)
-- Memastikan guru hanya bisa mengelola data miliknya sendiri
drop policy if exists "Users can manage own questions" on public.questions;
create policy "Users can manage own questions" on public.questions
  for all using (auth.uid() = created_by);

drop policy if exists "Users can manage own drive integration" on public.google_drive_integrations;
create policy "Users can manage own drive integration" on public.google_drive_integrations
  for all using (auth.uid() = user_id);

drop policy if exists "Users can manage own AI documents" on public.ai_documents;
create policy "Users can manage own AI documents" on public.ai_documents
  for all using (auth.uid() = user_id);

-- 7. INDEKS PERFORMA
create index if not exists idx_questions_user on public.questions(created_by);
create index if not exists idx_questions_topic on public.questions(topic);
create index if not exists idx_questions_subject on public.questions(subject);
