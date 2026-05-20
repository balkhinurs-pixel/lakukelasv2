-- Blueprint Database untuk Fitur RPP AI LakuKelas

-- 1. Tabel Metadata Dokumen AI (Khusus RPP)
CREATE TABLE IF NOT EXISTS public.ai_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- Diisi 'rpp'
    title TEXT NOT NULL,
    subject TEXT,
    class_level TEXT,
    drive_file_id TEXT,
    drive_file_url TEXT,
    drive_folder_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Keamanan Row Level Security (RLS)
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Memastikan data terisolasi per Guru
CREATE POLICY "Guru dapat mengelola RPP milik sendiri" 
ON public.ai_documents
FOR ALL USING (auth.uid() = user_id);

-- 4. Indeks untuk mempercepat pencarian arsip
CREATE INDEX IF NOT EXISTS idx_ai_docs_user_type ON public.ai_documents(user_id, document_type);
