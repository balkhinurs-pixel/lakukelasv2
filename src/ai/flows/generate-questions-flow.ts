'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan soal secara terstruktur (JSON).
 * Menggunakan API Key pribadi milik guru.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';

const QuestionSchema = z.object({
  sort_order: z.number().describe('Urutan soal'),
  type: z.enum(['multiple_choice', 'essay']).describe('Tipe soal'),
  question: z.string().describe('Teks pertanyaan (bisa berisi LaTeX)'),
  options: z.record(z.string(), z.string()).optional().describe('Pilihan jawaban A-D/E'),
  answer: z.string().describe('Kunci jawaban (huruf opsi atau teks esai)'),
  explanation: z.string().describe('Pembahasan soal'),
  difficulty: z.enum(['mudah', 'sedang', 'sulit']).describe('Tingkat kesulitan'),
  cognitive_level: z.string().optional().describe('Level kognitif C1-C6'),
  language_direction: z.enum(['ltr', 'rtl']).default('ltr').describe('Arah teks'),
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
  question_type: z.enum(['multiple_choice', 'essay']),
  count: z.number().default(5),
  difficulty: z.enum(['mudah', 'sedang', 'sulit']),
});

export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema),
});

export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;

export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesi login berakhir.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('gemini_api_key')
    .eq('id', user.id)
    .single();

  if (!profile?.gemini_api_key) {
    throw new Error("API Key Gemini belum diatur di Pengaturan.");
  }

  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
    model: googleAI.model('gemini-2.5-flash'),
  });

  const isHighSchool = input.jenjang.includes('SMA') || input.jenjang.includes('SMK') || input.jenjang.includes('MA');
  const optionCount = isHighSchool ? 5 : 4;

  const response = await ai.generate({
    output: { schema: GenerateQuestionsOutputSchema },
    prompt: `Anda adalah asisten guru profesional di Indonesia yang ahli dalam kurikulum ${input.curriculum}.
    
Tugas Anda:
Buatlah ${input.count} soal ${input.question_type === 'multiple_choice' ? 'Pilihan Ganda' : 'Esai'} untuk:
- Jenjang: ${input.jenjang}
- Kelas: ${input.kelas}
- Semester: ${input.semester || 'Tidak ditentukan'}
- Mata Pelajaran: ${input.subject}
- Topik Utama: ${input.topic}
- Sub-topik: ${input.subtopic || 'Umum'}
- Tujuan Asesmen: ${input.assessment_purpose}
- Tingkat Kesulitan: ${input.difficulty}
- Level Kognitif: ${input.cognitive_level || 'Variatif'}
- Mode Soal: ${input.mode || 'Reguler'}
- Instruksi Tambahan: ${input.instruction || 'Tidak ada'}

Aturan Penting:
1. Pilihan Ganda: Harus memiliki ${optionCount} opsi (${isHighSchool ? 'A-E' : 'A-D'}).
2. Rumus Matematika: Gunakan LaTeX valid (contoh: \\(x^2 + 2x + 1 = 0\\)).
3. Bahasa Arab: Gunakan Unicode asli dan set language_direction: 'rtl' jika ada teks Arab.
4. Pastikan soal berkualitas, tidak ambigu, dan sesuai level siswa kelas ${input.kelas}.
5. Berikan pembahasan (explanation) yang ringkas namun jelas.
${input.curriculum.includes('KBC') ? 'Gunakan pendekatan Kurikulum Berbasis Capaian (KBC) Kemenag yang menekankan pada nilai-nilai moderasi beragama jika relevan.' : ''}

Output harus berupa JSON valid sesuai skema yang diminta.`,
  });

  const result = response.output;
  if (!result) throw new Error("Gagal menghasilkan soal. Periksa API Key Anda.");
  return result;
}
