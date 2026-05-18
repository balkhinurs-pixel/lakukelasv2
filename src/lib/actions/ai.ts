
'use server';

import { generateEducationContent, type EducationContentInput, type EducationContentOutput } from '@/ai/flows/generate-education-content';
import { generateQuestions, type GenerateQuestionsInput, type GenerateQuestionsOutput } from '@/ai/flows/generate-questions-flow';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { GeneratedQuestion, QuestionGenerationInput } from '@/lib/types';
import { saveNaskahToDrive } from './google-drive';

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
 */
export async function generateQuestionImageAction(prompt: string) {
    try {
        const sanitizedPrompt = prompt.replace(/[\n\r]/g, " ").trim();
        const encodedPrompt = encodeURIComponent(sanitizedPrompt);
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&model=flux&seed=${seed}`;
        return { success: true, url: imageUrl };
    } catch (error: any) {
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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi." };

    try {
        await supabase.from('questions').delete().in('id', ids).eq('created_by', user.id);
        revalidatePath('/dashboard/ai-pembelajaran/bank-soal');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Gagal menghapus data soal." };
    }
}

/**
 * Server Action untuk menyusun naskah ujian dari daftar soal terpilih.
 * Mendukung konversi Markdown ke format profesional untuk Drive.
 */
export async function createNaskahUjianAction(title: string, selectedQuestionIds: string[], metadata: { class: string, subject: string, schoolName: string, examType: string }) {
    const supabase = createClient();
    const { data: questions, error: fetchError } = await supabase
        .from('questions')
        .select('*')
        .in('id', selectedQuestionIds)
        .order('sort_order', { ascending: true });

    if (fetchError || !questions || questions.length === 0) {
        return { success: false, error: "Gagal mengambil data soal terpilih." };
    }

    // 1. Bangun Konten Markdown untuk Naskah
    let content = `# ${metadata.schoolName.toUpperCase()}\n`;
    content += `## ${metadata.examType.toUpperCase()}\n\n`;
    content += `**Mata Pelajaran:** ${metadata.subject}\n`;
    content += `**Kelas:** ${metadata.class}\n`;
    content += `**Tanggal:** ${new Date().toLocaleDateString('id-ID')}\n`;
    content += `**Waktu:** 90 Menit\n`;
    content += `\n---\n\n`;

    content += `### PETUNJUK PENGERJAAN:\n`;
    content += `1. Berdoalah sebelum mengerjakan.\n`;
    content += `2. Tuliskan identitas Anda pada lembar jawab.\n`;
    content += `3. Jawablah pertanyaan dengan jujur dan teliti.\n\n`;

    questions.forEach((q, idx) => {
        content += `**${idx + 1}. ${q.question_text}**\n\n`;
        if (q.options_json) {
            Object.entries(q.options_json as Record<string, string>).sort().forEach(([key, val]) => {
                content += `${key}. ${val}\n`;
            });
        }
        content += `\n`;
    });

    content += `\n\n--- KUNCI JAWABAN (LAMPIRAN TERPISAH) ---\n\n`;
    questions.forEach((q, idx) => {
        content += `${idx + 1}. Kunci: ${q.correct_answer}\n`;
    });

    // 2. Simpan ke Google Drive (Deep Nesting)
    const result = await saveNaskahToDrive(title, content, metadata);
    
    // 3. Return data agar bisa di-download di client
    return { 
        ...result, 
        markdown: content // Untuk pemicu download lokal
    };
}
