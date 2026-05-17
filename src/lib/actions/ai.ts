'use server';

import { generateEducationContent, type EducationContentInput, type EducationContentOutput } from '@/ai/flows/generate-education-content';
import { generateQuestions, type GenerateQuestionsInput, type GenerateQuestionsOutput } from '@/ai/flows/generate-questions-flow';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
export async function generateQuestionsAction(input: GenerateQuestionsInput) {
    try {
        const result = await generateQuestions(input);
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Question Generation Error:", error);
        return { success: false, error: error.message || "Gagal menghasilkan soal." };
    }
}