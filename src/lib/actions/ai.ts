
'use server';

import { generateEducationContent, type EducationContentInput, type EducationContentOutput } from '@/ai/flows/generate-education-content';
import { generateQuestions, type GenerateQuestionsInput, type GenerateQuestionsOutput } from '@/ai/flows/generate-questions-flow';
import { generateModulAjar, type ModulAjarInput, type ModulAjarOutput } from '@/ai/flows/generate-modul-ajar-flow';
import { generateCpAtp, type CpAtpInput, type CpAtpOutput } from '@/ai/flows/generate-cp-atp-flow';
import { generateMaterial, type MaterialGenerationInput, type MaterialGenerationOutput } from '@/ai/flows/generate-material-flow';
import { generateKisiKisi, type KisiKisiInput, type KisiKisiOutput } from '@/ai/flows/generate-kisi-kisi-flow';
import { correctExam, type CorrectExamInput, type CorrectExamOutput } from '@/ai/flows/correct-exam-flow';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { GeneratedQuestion, QuestionGenerationInput } from '@/lib/types';
import { saveGenericDocumentToDrive } from './google-drive';
import { createStreamableValue } from 'ai/rsc';

/**
 * Helper untuk menghitung jumlah baris yang dibutuhkan sebuah soal di LJK
 * Harus sama persis logikanya dengan print-ljk-view.tsx
 */
const getSubRowCount = (q: any) => {
    if (q.question_type !== 'matching') return 1;
    // Deteksi baris yang diawali angka (misal: "1. Ibukota Indonesia")
    const lines = q.question_text?.split('\n').filter((l: string) => /^\d+[\.\)]/.test(l.trim()));
    return lines?.length > 0 ? lines.length : 1;
};

/**
 * Server Action untuk Koreksi LJK Hybrid - V85.0.
 * Menangani identifikasi NIS dan penskoran proporsional (Matching & Multi-row).
 */
export async function correctExamAction(
    naskahId: string, 
    scanRaw: { detectedNis: string, studentAnswers: { questionNum: number, studentChoice: string }[] }, 
    pointRules: { multiple_choice: number, matching: number, true_false: number, short_answer: number, essay: number }
) {
    const supabase = await createClient();
    try {
        // 1. Ambil Detail Naskah & Urutan Soal
        const { data: naskah } = await supabase
            .from('ai_documents')
            .select('question_ids')
            .eq('id', naskahId)
            .single();

        if (!naskah?.question_ids) throw new Error("Detail naskah tidak ditemukan.");

        // Ambil butir soal mentah dan urutkan sesuai question_ids
        const { data: rawQuestions } = await supabase
            .from('questions')
            .select('id, sort_order, correct_answer, question_type, question_text')
            .in('id', naskah.question_ids);

        if (!rawQuestions) throw new Error("Gagal memuat kunci jawaban.");

        // Urutkan questions sesuai naskah
        const questions = naskah.question_ids.map(id => rawQuestions.find(q => q.id === id)).filter(Boolean);

        // 2. LOGIKA PENSKORAN BERJENJANG (SUB-ROW)
        let totalWeightedScore = 0;
        let maxPossibleScore = 0;
        let scanIdx = 0; // Pointer untuk membaca baris scanRaw.studentAnswers
        
        const results = questions.map((q: any) => {
            const rowCount = getSubRowCount(q);
            const itemType = q.question_type;
            const itemPoint = pointRules[itemType as keyof typeof pointRules] || 0;
            
            let itemCorrectCount = 0;
            const subResults = [];

            // Jika soal memiliki sub-row (menjodohkan)
            if (q.question_type === 'matching' && rowCount > 1) {
                // Parsing kunci jawaban AI: "1-A, 2-B, 3-C"
                const keys = q.correct_answer.split(',').map((s: string) => s.trim().split('-')[1]?.toUpperCase());

                for (let i = 0; i < rowCount; i++) {
                    const studentChoice = scanRaw.studentAnswers[scanIdx]?.studentChoice?.trim().toUpperCase();
                    const correctKey = keys[i];
                    const isSubCorrect = studentChoice === correctKey;
                    
                    if (isSubCorrect) itemCorrectCount++;
                    
                    subResults.push({
                        subLabel: `${q.sort_order}.${i+1}`,
                        studentChoice,
                        correctKey,
                        isCorrect: isSubCorrect
                    });
                    scanIdx++;
                }

                // Skor untuk matching adalah (jumlah benar / total pasangan) * poin soal
                const weightedItemScore = (itemCorrectCount / rowCount) * itemPoint;
                totalWeightedScore += weightedItemScore;
                maxPossibleScore += itemPoint;

            } else {
                // Soal Standar (PG, B/S, Isian)
                const studentChoice = scanRaw.studentAnswers[scanIdx]?.studentChoice?.trim().toUpperCase();
                const correctKey = q.correct_answer?.trim().toUpperCase();
                const isCorrect = studentChoice === correctKey;

                if (isCorrect) totalWeightedScore += itemPoint;
                maxPossibleScore += itemPoint;

                subResults.push({
                    studentChoice,
                    correctKey,
                    isCorrect
                });
                scanIdx++;
            }

            return {
                questionNum: q.sort_order,
                type: itemType,
                isCorrect: itemCorrectCount === rowCount, // Hanya true jika benar semua untuk ringkasan UI
                subResults
            };
        });

        const finalScore = maxPossibleScore > 0 ? Math.round((totalWeightedScore / maxPossibleScore) * 100) : 0;

        // 3. Identifikasi Siswa
        const cleanNis = scanRaw.detectedNis.replace(/\?/g, '0');
        const { data: student } = await supabase
            .from('students')
            .select('id, name')
            .eq('nis', cleanNis)
            .maybeSingle();

        return { 
            success: true, 
            data: {
                detectedNis: cleanNis,
                studentName: student?.name || `Siswa NIS ${cleanNis} (Belum Terdaftar)`,
                studentId: student?.id,
                studentAnswers: results, // Format baru yang lebih detail
                totalScore: finalScore,
                analysis: `Koreksi Lokal V85. Scan ${scanIdx} baris.`
            } 
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function generateContentAction(input: EducationContentInput) {
    try {
        const result = await generateEducationContent(input);
        return { success: true, data: result };
    } catch (error: any) {
        return { success: false, error: error.message || "Gagal menghubungi AI." };
    }
}

export async function streamModulAjarAction(input: ModulAjarInput) {
    const supabase = await createClient();
    const stream = createStreamableValue();
    (async () => {
        try {
            let finalAtpContent = "";
            const atpId = (input as any).atp_id;
            if (atpId && atpId !== 'none') {
                const { data: atpDoc } = await supabase.from('cp_atp').select('content').eq('id', atpId).single();
                finalAtpContent = atpDoc?.content || "";
            }
            const { atp_id: _, ...aiInput }: any = input;
            const result = await generateModulAjar({ ...aiInput, atpContent: finalAtpContent });
            stream.update(result);
            stream.done();
        } catch (error: any) {
            stream.error(error.message);
        }
    })();
    return { output: stream.value };
}

export async function streamCpAtpAction(input: CpAtpInput) {
    const stream = createStreamableValue();
    (async () => {
        try {
            const result = await generateCpAtp(input);
            stream.update(result);
            stream.done();
        } catch (error: any) {
            stream.error(error.message);
        }
    })();
    return { output: stream.value };
}

export async function streamMaterialAction(input: MaterialGenerationInput) {
    const stream = createStreamableValue();
    (async () => {
        try {
            const result = await generateMaterial(input);
            stream.update(result);
            stream.done();
        } catch (error: any) {
            stream.error(error.message);
        }
    })();
    return { output: stream.value };
}

export async function streamQuestionsAction(input: QuestionGenerationInput) {
    const stream = createStreamableValue();
    (async () => {
        try {
            const safeInput = { ...input, count: Math.min(input.count, 5) };
            const result = await generateQuestions(safeInput);
            stream.update(result);
            stream.done();
        } catch (error: any) {
            stream.error(error.message);
        }
    })();
    return { output: stream.value };
}

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

export async function createNaskahUjianAction(
    title: string, 
    selectedQuestionIds: string[], 
    metadata: { jenjang: string, class: string, subject: string, schoolName: string, examType: string, examDate?: string, examTime?: string }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };
    try {
        const { data: questionsData } = await supabase.from('questions').select('id, question_type, sort_order').in('id', selectedQuestionIds);
        if (!questionsData) throw new Error("Gagal memproses urutan soal.");
        const typeOrder: Record<string, number> = { 'multiple_choice': 1, 'true_false': 2, 'matching': 3, 'short_answer': 4, 'essay': 5 };
        const sortedQuestionIds = [...questionsData].sort((a, b) => {
            const orderA = typeOrder[a.question_type] || 99;
            const orderB = typeOrder[b.question_type] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return (a.sort_order || 0) - (b.sort_order || 0);
        }).map(q => q.id);
        const { error } = await supabase.from('ai_documents').insert({
            user_id: user.id,
            document_type: 'naskah_ujian',
            title: title,
            class_level: metadata.class,
            subject: metadata.subject,
            question_ids: sortedQuestionIds,
            status: 'created',
            is_public: false
        });
        if (error) throw error;
        revalidatePath('/dashboard/ai-pembelajaran/naskah-soal');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

