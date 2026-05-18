
'use server';

import { generateEducationContent, type EducationContentInput, type EducationContentOutput } from '@/ai/flows/generate-education-content';
import { generateQuestions, type GenerateQuestionsInput, type GenerateQuestionsOutput } from '@/ai/flows/generate-questions-flow';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { GeneratedQuestion, QuestionGenerationInput } from '@/lib/types';

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
 * Server Action untuk memanggil flow AI Generate Soal Terstruktur.
 */
export async function generateQuestionsAction(input: QuestionGenerationInput) {
    try {
        const result = await generateQuestions(input);
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Question Generation Error:", error);
        return { success: false, error: error.message || "Gagal menghasilkan soal." };
    }
}

/**
 * Server Action untuk generate gambar menggunakan Pollinations.ai.
 * Keuntungan: Gratis, tanpa API Key, dan hanya berupa link (hemat DB).
 */
export async function generateQuestionImageAction(prompt: string) {
    try {
        // Membersihkan prompt dan menjadikannya URL Safe
        const sanitizedPrompt = prompt.replace(/[\n\r]/g, " ").trim();
        const encodedPrompt = encodeURIComponent(sanitizedPrompt);
        
        // Menggunakan Pollinations AI dengan model flux untuk kualitas edukasi yang baik
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&model=flux&seed=${seed}`;
        
        return { success: true, url: imageUrl };
    } catch (error: any) {
        console.error("Image Generation Error:", error);
        return { success: false, error: "Gagal merumuskan link gambar ilustrasi." };
    }
}

/**
 * Server Action untuk menyimpan kumpulan soal ke database Bank Soal.
 */
export async function saveQuestionsAction(config: QuestionGenerationInput, questions: GeneratedQuestion[]) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Tidak terautentikasi." };

    try {
        const groupId = crypto.randomUUID();
        
        // Mapped data sesuai struktur tabel 'questions' di PRD
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
            image_url: q.image_url || null
        }));

        const { error } = await supabase
            .from('questions')
            .insert(rows);

        if (error) throw error;

        revalidatePath('/dashboard/ai-pembelajaran/bank-soal');
        return { success: true };

    } catch (error: any) {
        console.error("Save Questions Error:", error);
        return { success: false, error: "Gagal menyimpan ke database." };
    }
}

/**
 * Server Action untuk menghapus satu atau lebih soal dari Bank Soal.
 */
export async function deleteQuestionsAction(ids: string[]) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi." };

    try {
        const { error } = await supabase
            .from('questions')
            .delete()
            .in('id', ids)
            .eq('created_by', user.id); // Security check: only own questions

        if (error) throw error;

        revalidatePath('/dashboard/ai-pembelajaran/bank-soal');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Gagal menghapus data soal." };
    }
}
