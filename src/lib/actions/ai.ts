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
 * Server Action untuk menyimpan kumpulan soal ke database Bank Soal.
 */
export async function saveQuestionsAction(config: QuestionGenerationInput, questions: GeneratedQuestion[]) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Tidak terautentikasi." };

    try {
        // Ambil school_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('school_name') // Dalam demo school_id disimulasikan dari profil
            .eq('id', user.id)
            .single();

        const groupId = crypto.randomUUID();
        
        // Mapped data sesuai struktur tabel 'questions' di PRD
        const rows = questions.map(q => ({
            created_by: user.id,
            generation_group_id: groupId,
            jenjang: config.jenjang,
            kelas: config.kelas, // Hanya angka tingkat (misal: 7)
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
            needs_review: true
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
