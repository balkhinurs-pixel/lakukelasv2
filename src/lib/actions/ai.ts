'use server';

import { generateEducationContent, type EducationContentInput, type EducationContentOutput } from '@/ai/flows/generate-education-content';
import { generateQuestions, type GenerateQuestionsInput, type GenerateQuestionsOutput } from '@/ai/flows/generate-questions-flow';
import { generateModulAjar, type ModulAjarInput, type ModulAjarOutput } from '@/ai/flows/generate-modul-ajar-flow';
import { generateCpAtp, type CpAtpInput, type CpAtpOutput } from '@/ai/flows/generate-cp-atp-flow';
import { generateMaterial, type MaterialGenerationInput, type MaterialGenerationOutput } from '@/ai/flows/generate-material-flow';
import { generateKisiKisi, type KisiKisiInput, type KisiKisiOutput } from '@/ai/flows/generate-kisi-kisi-flow';
import { correctExam, type CorrectExamInput, type CorrectExamOutput } from '@/ai/flows/correct-exam-flow';
import { generateQuestionImage, type GenerateImageInput } from '@/ai/flows/generate-image-flow';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { GeneratedQuestion, QuestionGenerationInput } from '@/lib/types';
import { saveGenericDocumentToDrive } from './google-drive';
import { createStreamableValue } from 'ai/rsc';

const getSubRowCount = (q: any) => {
    if (q.question_type !== 'matching') return 1;
    const lines = q.question_text?.split('\n').filter((l: string) => /^\d+[\.\)]/.test(l.trim()));
    return lines?.length > 0 ? lines.length : 1;
};

/**
 * Menghasilkan gambar ilustrasi untuk soal menggunakan Imagen.
 */
export async function generateQuestionImageAction(questionId: string, text: string, subject: string) {
    try {
        const result = await generateQuestionImage({ questionText: text, subject });
        return { success: true, imageUrl: result.imageUrl };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Menyimpan visual (SVG/Data URI) ke database soal.
 */
export async function updateQuestionVisualAction(questionId: string, visualData: string) {
    const supabase = await createClient();
    try {
        const { error } = await supabase
            .from('questions')
            .update({ visual_svg: visualData })
            .eq('id', questionId);
        
        if (error) throw error;
        revalidatePath('/dashboard/ai-pembelajaran/bank-soal');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Server Action untuk Koreksi LJK V130 (QR Smart Identity).
 */
export async function correctExamAction(
    naskahId: string, 
    scanRaw: { studentAnswers: { questionNum: number, studentChoice: string }[] }, 
    pointRules: { multiple_choice: number, matching: number, true_false: number, short_answer: number, essay: number }
) {
    const supabase = await createClient();
    try {
        const { data: naskah } = await supabase.from('ai_documents').select('question_ids, class_level').eq('id', naskahId).single();
        if (!naskah?.question_ids) throw new Error("Naskah tidak ditemukan.");

        const { data: rawQuestions } = await supabase.from('questions').select('id, sort_order, correct_answer, question_type, question_text').in('id', naskah.question_ids);
        if (!rawQuestions) throw new Error("Kunci jawaban gagal dimuat.");

        const sortedQuestions = naskah.question_ids.map(id => rawQuestions.find(q => q.id === id)).filter(Boolean);

        const gridItems: any[] = [];
        let currentType = "";
        sortedQuestions.forEach((q: any, qIdx: number) => {
            if (q.question_type !== currentType) {
                currentType = q.question_type;
                gridItems.push({ type: 'header', label: currentType }); 
            }
            
            const count = getSubRowCount(q);
            if (count > 1) {
                const keys = q.correct_answer.split(',').map((s: string) => s.trim().split('-')[1]?.toUpperCase());
                for (let i = 0; i < count; i++) {
                    gridItems.push({ 
                        type: 'row', 
                        questionId: q.id, 
                        correctKey: keys[i] || "", 
                        displayNum: `${q.sort_order || qIdx + 1}.${i + 1}`,
                        itemType: q.question_type, 
                        rowCount: count 
                    });
                }
            } else {
                let key = q.correct_answer?.trim().toUpperCase();
                if (q.question_type === 'true_false') {
                    if (key === 'TRUE' || key === 'BENAR') key = 'B';
                    if (key === 'FALSE' || key === 'SALAH') key = 'S';
                }
                gridItems.push({ 
                    type: 'row', 
                    questionId: q.id, 
                    correctKey: key, 
                    displayNum: String(q.sort_order || qIdx + 1), 
                    itemType: q.question_type, 
                    rowCount: 1 
                });
            }
        });

        let totalWeightedScore = 0;
        let maxPossibleScore = 0;
        const studentAnalysis: any[] = [];
        const questionResults = new Map();

        scanRaw.studentAnswers.forEach((scanSlot, idx) => {
            const item = gridItems[idx];
            if (!item || item.type === 'header') return;

            const studentChoice = scanSlot.studentChoice?.trim().toUpperCase();
            const isCorrect = studentChoice !== "EMPTY" && studentChoice === item.correctKey;
            const itemPoint = pointRules[item.itemType as keyof typeof pointRules] || 0;

            if (!questionResults.has(item.questionId)) {
                questionResults.set(item.questionId, {
                    itemType: item.itemType,
                    correctCount: 0,
                    rowCount: item.rowCount,
                    pointValue: itemPoint,
                    subResults: []
                });
            }

            const res = questionResults.get(item.questionId);
            if (isCorrect) res.correctCount++;
            res.subResults.push({
                questionNum: item.displayNum,
                studentChoice,
                correctKey: item.correctKey,
                isCorrect
            });
        });

        questionResults.forEach((res) => {
            const weightedScore = (res.correctCount / res.rowCount) * res.pointValue;
            totalWeightedScore += weightedScore;
            maxPossibleScore += res.pointValue;
            studentAnalysis.push(...res.subResults);
        });

        const finalScore = maxPossibleScore > 0 ? Math.round((totalWeightedScore / maxPossibleScore) * 100) : 0;
        
        return { 
            success: true, 
            data: {
                detectedNis: "PENDING_AI",
                studentName: "Siswa Terdeteksi QR",
                studentId: null,
                studentAnswers: studentAnalysis,
                totalScore: finalScore,
                analysis: `V130 - QR-Ready Matrix Scan.`
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

export async function saveMaterialToDriveAction(
    title: string, 
    content: string, 
    metadata: { jenjang: string, class: string, subject: string }
) {
    return saveGenericDocumentToDrive(title, content, metadata, 'Materi Belajar', 'doc');
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
            is_public: false,
            exam_date: metadata.examDate,
            exam_time: metadata.examTime
        });
        if (error) throw error;
        revalidatePath('/dashboard/ai-pembelajaran/naskah-soal');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
