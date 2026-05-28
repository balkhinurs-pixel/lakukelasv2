'use server';

import { generateEducationContent, type EducationContentInput, type EducationContentOutput } from '@/ai/flows/generate-education-content';
import { generateQuestions, type GenerateQuestionsInput, type GenerateQuestionsOutput } from '@/ai/flows/generate-questions-flow';
import { generateModulAjar, type ModulAjarInput, type ModulAjarOutput } from '@/ai/flows/generate-modul-ajar-flow';
import { generateCpAtp, type CpAtpInput, type CpAtpOutput } from '@/ai/flows/generate-cp-atp-flow';
import { generateMaterial, type MaterialGenerationInput, type MaterialGenerationOutput } from '@/ai/flows/generate-material-flow';
import { generateKisiKisi, type KisiKisiInput, type KisiKisiOutput } from '@/ai/flows/generate-kisi-kisi-flow';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { GeneratedQuestion, QuestionGenerationInput } from '@/lib/types';
import { saveNaskahToDrive, saveCpAtpToDrive, saveGenericDocumentToDrive } from './google-drive';
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
 * Server Action khusus untuk Generate Modul Ajar (RPP) Profesional dengan STREAMING.
 */
export async function streamModulAjarAction(input: ModulAjarInput) {
    const supabase = await createClient();
    const stream = createStreamableValue();
    
    (async () => {
        try {
            let finalAtpContent = "";
            const atpId = input.atp_id;

            if (atpId && atpId !== 'none') {
                const { data: atpDoc } = await supabase
                    .from('cp_atp')
                    .select('content')
                    .eq('id', atpId)
                    .single();
                finalAtpContent = atpDoc?.content || "";
            }

            // Hapus atp_id dari payload karena tidak ada di schema flow AI (agar tidak error validasi)
            const { atp_id: _, ...aiInput } = input;

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
 */
export async function streamQuestionsAction(input: QuestionGenerationInput) {
    const stream = createStreamableValue();

    (async () => {
        try {
            const result = await generateQuestions(input);
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
            .in('id', doc.question_ids);

        if (!questions || questions.length === 0) {
            return { success: false, error: "Gagal memuat butir soal dari database." };
        }

        const result = await generateKisiKisi({
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
 * Server Action untuk menyusun naskah ujian.
 */
export async function createNaskahUjianAction(
    title: string, 
    selectedQuestionIds: string[], 
    metadata: { jenjang: string, class: string, subject: string, schoolName: string, examType: string },
    format: 'pdf' | 'doc' = 'doc',
    binaryPdf?: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Tidak terautentikasi" };
    
    // Jika format adalah PDF, unggah data biner ke Drive
    if (format === 'pdf' && binaryPdf) {
        const result = await saveNaskahToDrive(title, binaryPdf, metadata, 'pdf');
        // Update metadata with question_ids for kisi-kisi logic
        if (result.success) {
            await supabase.from('ai_documents').update({ question_ids: selectedQuestionIds }).eq('drive_file_id', result.file_id);
        }
        return { ...result, format: 'pdf' };
    }

    // Jika format adalah DOC, ambil data soal dan susun Markdown
    const { data: questions, error: fetchError } = await supabase
        .from('questions')
        .select('*')
        .in('id', selectedQuestionIds);

    // Pastikan soal diurutkan sesuai urutan input array IDs
    const orderedQuestions = selectedQuestionIds.map(id => questions?.find(q => q.id === id)).filter(Boolean);

    if (fetchError || orderedQuestions.length === 0) {
        return { success: false, error: "Gagal mengambil data soal terpilih." };
    }

    // Bangun Konten Naskah Formal (Markdown)
    let content = `
${metadata.schoolName.toUpperCase()}
${metadata.examType.toUpperCase()}
==========================================
Jenjang        : ${metadata.jenjang}
Mata Pelajaran : ${metadata.subject}
Kelas          : ${metadata.class}
Tanggal        : ${new Date().toLocaleDateString('id-ID')}
==========================================

`;

    orderedQuestions.forEach((q, idx) => {
        content += `${idx + 1}. ${q.question_text}\n`;
        if (q.options_json) {
            Object.entries(q.options_json as Record<string, string>).sort().forEach(([key, val]) => {
                content += `   ${key}. ${val}\n`;
            });
        }
        content += `\n`;
    });

    const result = await saveNaskahToDrive(title, content, metadata, 'doc');
    
    // Update metadata with question_ids for kisi-kisi logic
    if (result.success) {
        await supabase.from('ai_documents').update({ question_ids: selectedQuestionIds }).eq('drive_file_id', result.file_id);
    }
    
    return { 
        ...result, 
        markdown: content,
        format: 'doc'
    };
}

export async function saveMaterialToDriveAction(title: string, content: string, metadata: { jenjang: string, class: string, subject: string }) {
    return saveGenericDocumentToDrive(title, content, metadata, 'Materi Belajar', 'doc');
}
