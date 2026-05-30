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
 * Server Action untuk Koreksi LJK Hybrid (OpenCV + Gemini) - V82.0.
 * Mendukung penskoran manual berdasarkan poin per tipe soal.
 */
export async function correctExamAction(
    naskahId: string, 
    photoDataUri: string, 
    pointRules: { multiple_choice: number, matching: number, true_false: number, short_answer: number, essay: number }
) {
    const supabase = await createClient();
    try {
        // 1. Deteksi Visual (Saat ini masih pakai Gemini scanner, kedepan dipindah ke client-side OpenCV 100%)
        const scanResult = await correctExam({ photoDataUri });

        // 2. Ambil Kunci & Tipe Soal dari Database
        const { data: naskah } = await supabase
            .from('ai_documents')
            .select('question_ids')
            .eq('id', naskahId)
            .single();

        if (!naskah?.question_ids) throw new Error("Detail naskah hilang.");

        const { data: questionRecords } = await supabase
            .from('questions')
            .select('id, sort_order, correct_answer, question_type')
            .in('id', naskah.question_ids);

        if (!questionRecords) throw new Error("Kunci jawaban gagal dimuat.");

        // 3. LOGIKA PENSKORAN DENGAN BOBOT POIN MANUAL
        let totalWeightedScore = 0;
        let maxPossibleScore = 0;
        
        const processedAnswers = scanResult.detectedAnswers.map(ans => {
            const record = questionRecords.find(k => k.sort_order === ans.questionNum);
            const isCorrect = record ? (ans.studentChoice === record.correct_answer) : false;
            
            // Tentukan poin berdasarkan tipe soal
            const itemType = record?.question_type || 'multiple_choice';
            const itemPoint = pointRules[itemType as keyof typeof pointRules] || 0;
            
            if (isCorrect) totalWeightedScore += itemPoint;
            maxPossibleScore += itemPoint;
            
            return {
                questionNum: ans.questionNum,
                studentChoice: ans.studentChoice,
                isCorrect: isCorrect,
                pointEarned: isCorrect ? itemPoint : 0,
                type: itemType
            };
        });

        // Konversi poin ke skala 0-100
        const finalScore = maxPossibleScore > 0 ? Math.round((totalWeightedScore / maxPossibleScore) * 100) : 0;

        // 4. Identifikasi Siswa
        const { data: student } = await supabase
            .from('students')
            .select('id, name')
            .eq('nis', scanResult.detectedNis)
            .maybeSingle();

        return { 
            success: true, 
            data: {
                detectedNis: scanResult.detectedNis,
                studentName: student?.name || "Siswa Tidak Dikenal",
                studentId: student?.id,
                studentAnswers: processedAnswers,
                totalScore: finalScore,
                analysis: scanResult.analysis
            } 
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action lainnya (RPP, Soal, Materi, dll) tetap dipertahankan...
 */
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
