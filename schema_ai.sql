
-- ==========================================
-- LakuKelas AI & Google Drive Blueprint
-- Update: V45.0 (Dynamic Models & RPP Repo)
-- ==========================================

-- 1. Tabel Integrasi Google Drive
CREATE TABLE IF NOT EXISTS public.google_drive_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'google',
    drive_email TEXT,
    folder_id TEXT,
    folder_url TEXT,
    folder_name TEXT DEFAULT 'LakuKelas AI',
    status TEXT NOT NULL DEFAULT 'connected',
    connected_at TIMESTAMPTZ DEFAULT now(),
    disconnected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. Tabel Metadata Dokumen AI (Arsip RPP & Naskah Soal)
CREATE TABLE IF NOT EXISTS public.ai_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- 'rpp' atau 'naskah_ujian'
    title TEXT NOT NULL,
    subject TEXT,
    class_level TEXT,
    semester TEXT,
    drive_file_id TEXT,
    drive_file_url TEXT,
    drive_folder_id TEXT,
    mime_type TEXT,
    is_public BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'created',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Update Kolom Preferensi Model pada Tabel Profiles
-- Jalankan ini jika tabel profiles sudah ada
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='ai_model') THEN
        ALTER TABLE public.profiles ADD COLUMN ai_model TEXT DEFAULT 'gemini-2.5-flash';
    END IF;
END $$;

-- RLS (Row Level Security) Configuration
ALTER TABLE public.google_drive_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;

-- Policies for google_drive_integrations
DROP POLICY IF EXISTS "Users can view own drive integration" ON public.google_drive_integrations;
CREATE POLICY "Users can view own drive integration" ON public.google_drive_integrations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own drive integration" ON public.google_drive_integrations;
CREATE POLICY "Users can insert own drive integration" ON public.google_drive_integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own drive integration" ON public.google_drive_integrations;
CREATE POLICY "Users can update own drive integration" ON public.google_drive_integrations
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for ai_documents
DROP POLICY IF EXISTS "Users can view own AI documents" ON public.ai_documents;
CREATE POLICY "Users can view own AI documents" ON public.ai_documents
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own AI documents" ON public.ai_documents;
CREATE POLICY "Users can insert own AI documents" ON public.ai_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own AI documents" ON public.ai_documents;
CREATE POLICY "Users can delete own AI documents" ON public.ai_documents
    FOR DELETE USING (auth.uid() = user_id);
