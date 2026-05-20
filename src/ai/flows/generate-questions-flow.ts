'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan soal secara terstruktur (JSON).
 * Menggunakan model dinamis sesuai pilihan guru di database.
 * Dioptimalkan untuk LaTeX (Matematika) dan Unicode Arab.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';

const QuestionSchema = z.object({
  sort_order: z.number().describe('Urutan soal'),
  type: z.enum(['multiple_choice', 'essay']).describe('Tipe soal'),
  question: z.string().describe('Teks pertanyaan (WAJIB menggunakan LaTeX \(...\) untuk rumus)'),
  options: z.record(z.string(), z.string()).optional().describe('Pilihan jawaban A-D/E (Gunakan LaTeX untuk rumus)'),
  answer: z.string().describe('Kunci jawaban (huruf opsi atau teks esai)'),
  explanation: z.string().describe('Pembahasan soal (Gunakan LaTeX untuk rumus)'),
  difficulty: z.enum(['mudah', 'sedang', 'sulit', 'campuran']).describe('Tingkat kesulitan'),
  cognitive_level: z.string().optional().describe('Level kognitif C1-C6'),
  language_direction: z.enum(['ltr', 'rtl']).default('ltr').describe('Arah teks'),
  image_prompt: z.string().optional().describe('Detailed English description for an educational image related to this question.'),
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
  difficulty: z.enum(['mudah', 'sedang', 'sulit', 'campuran']),
  mediaDataUri: z.string().optional().describe('Materi dalam format Data URI (Base64)'),
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

  if (!user) throw new Error("Sesi login berakhir.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('gemini_api_key, ai_model')
    .eq('id', user.id)
    .single();

  if (!profile?.gemini_api_key) {
    throw new Error("API Key Gemini belum diatur di Pengaturan.");
  }

  // Gunakan model pilihan user atau fallback ke 2.5-flash
  const selectedModel = profile.ai_model || 'gemini-2.5-flash';

  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
    model: googleAI.model(selectedModel),
  });

  const isHighSchool = input.jenjang.includes('SMA') || input.jenjang.includes('SMK') || input.jenjang.includes('MA');
  const optionCount = isHighSchool ? 5 : 4;

  const response = await ai.generate({
    output: { schema: GenerateQuestionsOutputSchema },
    prompt: [
        ...(input.mediaDataUri ? [{ media: { url: input.mediaDataUri, contentType: input.mediaMimeType } }] : []),
        { text: `Anda adalah asisten guru profesional di Indonesia yang ahli dalam kurikulum ${input.curriculum}.
    
Tugas Anda:
Buatlah ${input.count} soal ${input.question_type === 'multiple_choice' ? 'Pilihan Ganda' : 'Esai'} untuk:
- Jenjang: ${input.jenjang}
- Kelas: ${input.kelas}
- Semester: ${input.semester || 'Tidak ditentukan'}
- Mata Pelajaran: ${input.subject}
- Topik Utama: ${input.topic}
- Sub-topik: ${input.subtopic || 'Umum'}
- Tujuan Asesmen: ${input.assessment_purpose}
- Tingkat Kesulitan: ${input.difficulty === 'campuran' ? 'Campuran (HOTS, Sedang, Mudah)' : input.difficulty}
- Level Kognitif: ${input.cognitive_level || 'Variatif'}
- Mode Soal: ${input.mode || 'Reguler'}
- Instruksi Tambahan: ${input.instruction || 'Tidak ada'}

${input.mediaDataUri ? `PENTING: Gunakan materi yang ada di file lampiran sebagai sumber utama pembuatan soal.` : ''}

ATURAN PENULISAN RUMUS (PENTING):
1. MATEMATIKA/SAINS: WAJIB menggunakan LaTeX valid.
   - Pembungkus Inline: Gunakan \\( ... \\). Contoh: \\( x^2 + y^2 = r^2 \\).
   - Pembungkus Blok: Gunakan \\[ ... \\]. Contoh: \\[ \frac{-b \pm \sqrt{b^2-4ac}}{2a} \\].
   - JANGAN gunakan simbol unicode mentah untuk akar, pangkat, atau pecahan kompleks.

2. BAHASA ARAB: WAJIB menggunakan Unicode asli Arab.
   - Jika mata pelajaran adalah Bahasa Arab atau PAI, set field "language_direction" ke "rtl".
   - Gunakan harakat yang lengkap untuk jenjang SD/SMP agar mudah dibaca.

3. KUALITAS SOAL:
   - Pilihan Ganda: Harus memiliki ${optionCount} opsi (${isHighSchool ? 'A-E' : 'A-D'}).
   - Pastikan kunci jawaban (answer) tepat sesuai salah satu key di "options".
   - Berikan pembahasan (explanation) yang logis dan edukatif.

Output harus berupa JSON valid sesuai skema.` }
    ]
  });

  const result = response.output;
  if (!result) throw new Error("Gagal menghasilkan soal. Periksa API Key Anda.");
  return result;
}