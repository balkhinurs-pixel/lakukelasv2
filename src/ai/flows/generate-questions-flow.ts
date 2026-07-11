'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan soal terstruktur.
 * Versi 1.x dengan Standar LakuKelas (Aksara Jawa & LaTeX).
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';
import { LAKUKELAS_SYSTEM_PROMPT } from '../system-prompt';

const QuestionSchema = z.object({
  sort_order: z.number(),
  type: z.enum(['multiple_choice', 'essay', 'short_answer', 'true_false', 'matching']),
  question: z.string().describe('Teks pertanyaan (LaTeX \(...\) untuk rumus)'),
  options: z.record(z.string(), z.string()).optional(),
  answer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(['mudah', 'sedang', 'sulit', 'campuran']),
  cognitive_level: z.string().optional(),
  language_direction: z.enum(['ltr', 'rtl']).default('ltr'),
  visual_svg: z.string().optional(),
});

const GenerateQuestionsInputSchema = z.object({
  jenjang: z.string(),
  kelas: z.string(),
  semester: z.string().optional(),
  subject: z.string(),
  curriculum: z.string(),
  assessment_purpose: z.string(),
  topic: z.string(),
  subtopic: z.string().optional(),
  cognitive_level: z.string().optional(),
  mode: z.string().optional(),
  instruction: z.string().optional(),
  question_type: z.enum(['multiple_choice', 'essay', 'short_answer', 'true_false', 'matching']),
  count: z.number().default(5),
  difficulty: z.enum(['mudah', 'sedang', 'sulit', 'campuran']),
  mediaDataUri: z.string().optional(),
  mediaMimeType: z.string().optional(),
});

export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema),
});

export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;

export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesi berakhir.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('gemini_api_key, ai_model')
    .eq('id', user.id)
    .single();

  if (!profile?.gemini_api_key) throw new Error("API Key Gemini belum diatur.");

  const selectedModel = profile.ai_model || 'gemini-1.5-flash';
  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
  });

  const response = await ai.generate({
    model: googleAI.model(selectedModel),
    system: LAKUKELAS_SYSTEM_PROMPT,
    output: { schema: GenerateQuestionsOutputSchema },
    prompt: [
        ...(input.mediaDataUri ? [{ media: { url: input.mediaDataUri, contentType: input.mediaMimeType || 'image/jpeg' } }] : []),
        { text: `Tugas: Buat ${input.count} soal tipe ${input.question_type} untuk Topik: ${input.topic} (${input.subject}).
        Detail: Kelas ${input.kelas}, Kurikulum ${input.curriculum}, Kesulitan ${input.difficulty}.
        Gunakan LaTeX untuk Matematika dan Unicode Aksara Jawa jika mata pelajaran Bahasa Jawa.` }
    ]
  });

  const result = response.output;
  if (!result) throw new Error("Gagal menghasilkan soal.");
  return result;
}
