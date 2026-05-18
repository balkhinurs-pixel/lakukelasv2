-- 1. Tambahkan kolom API Key ke tabel Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- 2. Tabel Bank Soal (Questions)
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_group_id uuid DEFAULT gen_random_uuid(),
  
  jenjang text NOT NULL,
  kelas text NOT NULL,
  semester text,
  subject text NOT NULL,
  curriculum text,
  assessment_purpose text,
  topic text NOT NULL,
  subtopic text,

  sort_order int NOT NULL,
  question_type text NOT NULL, -- 'multiple_choice' atau 'essay'
  question_text text NOT NULL,
  options_json jsonb, -- Menyimpan opsi A, B, C, D, E
  correct_answer text,
  explanation text,

  difficulty text, -- 'mudah', 'sedang', 'sulit'
  cognitive_level text, -- 'C1' - 'C6'
  language_direction text DEFAULT 'ltr',
  image_url text, -- Link dari Pollinations atau lainnya

  needs_review boolean DEFAULT true,
  status text DEFAULT 'draft', -- 'draft', 'published'

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Tabel Integrasi Google Drive
CREATE TABLE IF NOT EXISTS public.google_drive_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  folder_id text,
  folder_url text,
  folder_name text DEFAULT 'LakuKelas AI',
  status text NOT NULL DEFAULT 'connected',
  connected_at timestamptz DEFAULT now(),
  disconnected_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Tabel Metadata Dokumen AI (Link Hasil Ekspor)
CREATE TABLE IF NOT EXISTS public.ai_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL, -- 'rpp', 'soal', 'lkpd'
  title text NOT NULL,
  drive_file_id text,
  drive_file_url text,
  drive_folder_id text,
  status text DEFAULT 'created',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Aktifkan Row Level Security (RLS)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_drive_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;

-- 6. Kebijakan Keamanan (Policies)
-- Users hanya bisa melihat/mengelola data mereka sendiri

-- Questions
CREATE POLICY "Users can manage own questions" ON public.questions
    FOR ALL USING (auth.uid() = created_by);

-- Google Drive Integrations
CREATE POLICY "Users can manage own drive integration" ON public.google_drive_integrations
    FOR ALL USING (auth.uid() = user_id);

-- AI Documents
CREATE POLICY "Users can manage own AI documents" ON public.ai_documents
    FOR ALL USING (auth.uid() = user_id);
