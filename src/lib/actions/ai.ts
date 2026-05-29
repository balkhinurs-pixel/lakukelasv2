'use server';

import { generateEducationContent, type EducationContentInput, type EducationContentOutput } from '@/ai/flows/generate-education-content';
import { generateQuestions, type GenerateQuestionsInput, type GenerateQuestionsOutput } from '@/ai/flows/generate-questions-flow';
import { generateModulAjar, type ModulAjarInput, type ModulAjarOutput } from '@/ai/flows/generate-modul-ajar-flow';
import { generateCpAtp, type CpAtpInput, type CpAtpOutput } from '@/ai/flows/generate-cp-atp-flow';
import { generateMaterial, type MaterialGenerationInput, type MaterialGenerationOutput } from '@/ai/flows/generate-material-flow';
import { generateKisiKisi, type KisiKisiInput, type KisiKisiOutput } from '@/ai/flows/generate-kisi-kisi-flow';
import { generateKisiKisi as generateKisiKisiFlow } from '@/ai/flows/generate-kisi-kisi-flow';
import { correctExam, type CorrectExamInput, type CorrectExamOutput } from '@/ai/flows/correct-exam-flow';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { GeneratedQuestion, QuestionGenerationInput } from '@/lib/types';
import { saveGenericDocumentToDrive } from './google-drive';
import { createStreamableValue } from 'ai/rsc';

/**
 * Server Action untuk memanggil flow AI RPP/Konten Dasar.
 */
export async function generateContentAction(input: EducationContentInput) {
    try {
        const result = await generateEducationContent(input);
        return { success: true, data: result };
    } catch (error: any) {
        console.error("AI Generation Error:", error);
        return { success: false, error: error.message || "Gagal menghubungi AI." };
    }
}

/**
 * Server Action khusus untuk Koreksi LJK AI.
 * Update V66.0: Penanganan error kuota yang lebih bersih.
 */
export async function correctExamAction(naskahId: string, photoDataUri: string) {
    const supabase = await createClient();
    try {
        // 1. Ambil Kunci Jawaban dari Database
        const { data: naskah } = await supabase
            .from('ai_documents')
            .select('question_ids, subject, class_level')
            .eq('id', naskahId)
            .single();

        if (!naskah?.question_ids) throw new Error("Detail naskah tidak ditemukan.");

        const { data: questions } = await supabase
            .from('questions')
            .select('sort_order, correct_answer, question_type')
            .in('id', naskah.question_ids)
            .order('sort_order', { ascending: true });

        if (!questions) throw new Error("Gagal memuat kunci jawaban.");

        // 2. Panggil AI Vision Flow
        const result = await correctExam({
            photoDataUri,
            naskahId,
            correctAnswers: questions
        });

        // 3. Identifikasi Siswa Berdasarkan NIS Terdeteksi
        const { data: student } = await supabase
            .from('students')
            .select('id, name')
            .eq('nis', result.detectedNis)
            .maybeSingle();

        return { 
            success: true, 
            data: {
                ...result,
                studentName: student?.name || "Siswa Tidak Dikenal",
                studentId: student?.id,
                subject: naskah.subject,
                classLevel: naskah.class_level
            } 
        };
    } catch (error: any) {
        console.error("Scoring Error:", error.message);
        const errStr = error.message || "";
        
        // Bersihkan pesan error kuota untuk UI
        if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED")) {
            return { success: false, error: "429: Batas kuota API terlampaui. Silakan tunggu 1 menit lalu coba lagi." };
        }
        if (errStr.includes("503")) {
            return { success: false, error: "503: Server AI sedang sibuk. Silakan coba lagi nanti." };
        }
        
        return { success: false, error: errStr };
    }
}

/**
 * Server Action khusus untuk Generate Modul Ajar (RPP) Profesional dengan STREAMING.
 */
export async function streamModulAjarAction(input: ModulAjarInput) {
    const supabase = await createClient();
    const stream = createStreamableValue();
    
    (async () => {
        try {
            let finalAtpContent = "";
            const atpId = (input as any).atp_id;

            if (atpId && atpId !== 'none') {
                const { data: atpDoc } = await supabase
                    .from('cp_atp')
                    .select('content')
                    .eq('id', atpId)
                    .single();
                finalAtpContent = atpDoc?.content || "";
            }

            // Hapus atp_id dari payload karena tidak ada di schema flow AI
            const { atp_id: _, ...aiInput }: any = input;

            const result = await generateModulAjar({
                ...aiInput,
                atpContent: finalAtpContent
            });
            
            stream.update(result);
            stream.done();
        } catch (error: any) {
            stream.error(error.message || "Gagal menghasilkan modul ajar.");
        }
    })();

    return { output: stream.value };
}

/**
 * Server Action untuk Generate CP & ATP dengan STREAMING.
 */
export async function streamCpAtpAction(input: CpAtpInput) {
    const stream = createStreamableValue();

    (async () => {
        try {
            const result = await generateCpAtp(input);
            stream.update(result);
            stream.done();
        } catch (error: any) {
            stream.error(error.message || "Gagal menghasilkan pemetaan CP/ATP.");
        }
    })();

    return { output: stream.value };
}

/**
 * Server Action untuk Generate Materi Ajar dengan STREAMING.
 */
export async function streamMaterialAction(input: MaterialGenerationInput) {
    const stream = createStreamableValue();

    (async () => {
        try {
            const result = await generateMaterial(input);
            stream.update(result);
            stream.done();
        } catch (error: any) {
            stream.error(error.message || "Gagal menghasilkan materi ajar.");
        }
    })();

    return { output: stream.value };
}

/**
 * Server Action untuk memanggil flow AI Generate Soal Terstruktur dengan STREAMING.
 * Memiliki proteksi limit maksimal 5 soal.
 */
export async function streamQuestionsAction(input: QuestionGenerationInput) {
    const stream = createStreamableValue();

    (async () => {
        try {
            // Enforce limit 5 soal pada server action
            const safeInput = {
                ...input,
                count: Math.min(input.count, 5)
            };

            const result = await generateQuestions(safeInput);
            stream.update(result);
            stream.done();
        } catch (error: any) {
            stream.error(error.message || "Gagal menghasilkan soal.");
        }
    })();

    return { output: stream.value };
}

/**
 * Server Action untuk memanggil flow AI Generate Kisi-kisi dari Naskah.
 */
export async function generateKisiKisiAction(docId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Sesi berakhir." };

    try {
        const { data: doc } = await supabase
            .from('ai_documents')
            .select('*')
            .eq('id', docId)
            .single();

        if (!doc || !doc.question_ids || doc.question_ids.length === 0) {
            return { success: false, error: "Naskah ini tidak memiliki referensi soal." };
        }

        const { data: questions } = await supabase
            .from('questions')
            .select('sort_order, question_text, question_type, topic, cognitive_level, difficulty')
            .in('id', doc.question_ids)
            .order('sort_order', { ascending: true });

        if (!questions || questions.length === 0) {
            return { success: false, error: "Gagal memuat butir soal dari database." };
        }

        const result = await generateKisiKisiFlow({
            subject: doc.subject || "Umum",
            classLevel: doc.class_level || "Umum",
            examType: "Ujian / Penilaian",
            questions: questions
        });

        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message || "Gagal generate kisi-kisi." };
    }
}

/**
 * Server Action untuk mendapatkan detail pertanyaan dari sebuah naskah.
 */
export async function getNaskahDetailsAction(docId: string) {
    const supabase = await createClient();
    try {
        const { data: doc } = await supabase
            .from('ai_documents')
            .select('question_ids, title, subject, class_level')
            .eq('id', docId)
            .single();
            
        if (!doc?.question_ids || doc.question_ids.length === 0) return { success: false, error: "Daftar ID soal tidak ditemukan." };
        
        const { data: questions } = await supabase
            .from('questions')
            .select('*')
            .in('id', doc.question_ids)
            .order('sort_order', { ascending: true });
            
        return { success: true, doc, questions };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action untuk menyimpan kumpulan soal ke database Bank Soal.
 */
export async function saveQuestionsAction(config: QuestionGenerationInput, questions: GeneratedQuestion[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi." };

    try {
        const groupId = crypto.randomUUID();
        const rows = questions.map(q => ({
            created_by: user.id,
            generation_group_id: groupId,
            jenjang: config.jenjang,
            kelas: config.kelas,
            semester: config.semester,
            subject: config.subject,
            curriculum: config.curriculum,
            assessment_purpose: config.assessment_purpose,
            topic: config.topic,
            subtopic: config.subtopic,
            sort_order: q.sort_order,
            question_type: q.type,
            question_text: q.question,
            options_json: q.options || null,
            correct_answer: q.answer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            cognitive_level: q.cognitive_level,
            language_direction: q.language_direction || 'ltr',
            status: 'draft',
            needs_review: true,
            image_url: q.image_url || null,
            visual_svg: q.visual_svg || null
        }));

        const { error } = await supabase.from('questions').insert(rows);
        if (error) throw error;

        revalidatePath('/dashboard/ai-pembelajaran/bank-soal');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Gagal menyimpan ke database." };
    }
}

/**
 * Server Action untuk menghapus soal dari Bank Soal.
 */
export async function deleteQuestionsAction(ids: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };

    try {
        await supabase.from('questions').delete().in('id', ids).eq('created_by', user.id);
        revalidatePath('/dashboard/ai-pembelajaran/bank-soal');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Gagal menghapus data soal." };
    }
}

/**
 * Server Action untuk menyusun naskah ujian (V47.0 - Auto Grouping).
 * Soal dikelompokkan otomatis berdasarkan tipe standar pendidikan.
 */
export async function createNaskahUjianAction(
    title: string, 
    selectedQuestionIds: string[], 
    metadata: { jenjang: string, class: string, subject: string, schoolName: string, examType: string, examDate?: string, examTime?: string }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };
    
    try {
        // 1. Ambil data tipe soal untuk semua ID yang dipilih
        const { data: questionsData } = await supabase
            .from('questions')
            .select('id, question_type, sort_order')
            .in('id', selectedQuestionIds);
            
        if (!questionsData) throw new Error("Gagal memproses urutan soal.");

        // 2. Tentukan Urutan Tipe Soal Standar Ujian Indonesia
        const typeOrder: Record<string, number> = {
            'multiple_choice': 1, // I. PILIHAN GANDA
            'true_false': 2,      // II. BENAR / SALAH
            'matching': 3,        // III. MENJODOHKAN
            'short_answer': 4,    // IV. ISIAN SINGKAT
            'essay': 5            // V. URAIAN / ESAI
        };

        // 3. Urutkan ID soal berdasarkan tipe standar dan pertahankan urutan asli jika tipenya sama
        const sortedQuestionIds = [...questionsData]
            .sort((a, b) => {
                const orderA = typeOrder[a.question_type] || 99;
                const orderB = typeOrder[b.question_type] || 99;
                
                if (orderA !== orderB) return orderA - orderB;
                
                // Jika tipe sama, urutkan berdasarkan sort_order asli dari database
                return (a.sort_order || 0) - (b.sort_order || 0);
            })
            .map(q => q.id);

        // 4. Simpan metadata "Resep" soal ke ai_documents secara lokal
        const { error } = await supabase.from('ai_documents').insert({
            user_id: user.id,
            document_type: 'naskah_ujian',
            title: title,
            class_level: metadata.class,
            subject: metadata.subject,
            question_ids: sortedQuestionIds,
            exam_date: metadata.exam_date || null,
            exam_time: metadata.exam_time || null,
            status: 'created',
            is_public: false
        });

        if (error) throw error;
        
        revalidatePath('/dashboard/ai-pembelajaran/naskah-soal');
        return { success: true };
    } catch (e: any) {
        console.error("Error creating naskah:", e.message);
        return { success: false, error: e.message };
    }
}

export async function saveMaterialToDriveAction(title: string, content: string, metadata: { jenjang: string, class: string, subject: string }) {
    return saveGenericDocumentToDrive(title, content, metadata, 'Materi Belajar', 'doc');
}