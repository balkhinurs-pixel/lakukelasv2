
-- ==========================================
-- SKRIP PEMBUATAN TABEL MATERI PEMBELAJARAN
-- ==========================================

-- 1. Buat tabel materials
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Aktifkan Row Level Security (RLS)
-- Ini memastikan data aman dan hanya bisa diakses oleh pemiliknya
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- 3. Buat Kebijakan (Policies)
-- Kebijakan: Guru hanya bisa melihat materi miliknya sendiri
CREATE POLICY "Teachers can view their own materials" 
    ON public.materials FOR SELECT 
    USING (auth.uid() = teacher_id);

-- Kebijakan: Guru hanya bisa menambah materi atas nama dirinya sendiri
CREATE POLICY "Teachers can insert their own materials" 
    ON public.materials FOR INSERT 
    WITH CHECK (auth.uid() = teacher_id);

-- Kebijakan: Guru hanya bisa memperbarui materi miliknya sendiri
CREATE POLICY "Teachers can update their own materials" 
    ON public.materials FOR UPDATE 
    USING (auth.uid() = teacher_id);

-- Kebijakan: Guru hanya bisa menghapus materi miliknya sendiri
CREATE POLICY "Teachers can delete their own materials" 
    ON public.materials FOR DELETE 
    USING (auth.uid() = teacher_id);

-- 4. Buat Indeks untuk meningkatkan performa pencarian
CREATE INDEX IF NOT EXISTS idx_materials_teacher_id ON public.materials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_materials_class_id ON public.materials(class_id);
CREATE INDEX IF NOT EXISTS idx_materials_subject_id ON public.materials(subject_id);

-- Keterangan:
-- - teacher_id terhubung ke tabel profiles
-- - class_id terhubung ke tabel classes
-- - subject_id terhubung ke tabel subjects
-- - ON DELETE CASCADE memastikan jika data induk dihapus, materi terkait juga ikut terhapus
