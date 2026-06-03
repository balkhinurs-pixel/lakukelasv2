'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan soal secara terstruktur (JSON).
 * Menggunakan model dinamis sesuai pilihan guru di database.
 * Dioptimalkan untuk LaTeX (Matematika), Unicode Arab, Aksara Jawa, Tabel Markdown, dan Ilustrasi SVG Geometri.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';

const QuestionSchema = z.object({
  sort_order: z.number().describe('Urutan soal'),
  type: z.enum(['multiple_choice', 'essay', 'short_answer', 'true_false', 'matching']).describe('Tipe soal'),
  question: z.string().describe('Teks pertanyaan (WAJIB menggunakan LaTeX \(...\) untuk rumus)'),
  options: z.record(z.string(), z.string()).optional().describe('Pilihan jawaban A-D/E (Gunakan LaTeX untuk rumus). Hanya diisi jika tipe adalah multiple_choice, true_false, atau matching.'),
  answer: z.string().describe('Kunci jawaban (huruf opsi, teks esai, atau pasangan menjodohkan)'),
  explanation: z.string().describe('Pembahasan soal (Gunakan LaTeX untuk rumus)'),
  difficulty: z.enum(['mudah', 'sedang', 'sulit', 'campuran']).describe('Tingkat kesulitan'),
  cognitive_level: z.string().optional().describe('Level kognitif C1-C6'),
  language_direction: z.enum(['ltr', 'rtl']).default('ltr').describe('Arah teks'),
  image_prompt: z.string().optional().describe('Detailed English description for an educational image related to this question.'),
  visual_svg: z.string().optional().describe('Kode SVG minimalis untuk ilustrasi soal. HANYA SERTAKAN jika soal benar-benar membutuhkan bantuan visual (seperti bangun datar, grafik, atau diagram). Jika soal bersifat tekstual murni, kosongkan field ini.'),
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
  const isJavanese = input.subject.toLowerCase().includes('jawa');

  const response = await ai.generate({
    output: { schema: GenerateQuestionsOutputSchema },
    prompt: [
        ...(input.mediaDataUri ? [{ media: { url: input.mediaDataUri, contentType: input.mediaMimeType } }] : []),
        { text: `Anda adalah asisten guru profesional di Indonesia yang ahli dalam kurikulum ${input.curriculum}.
    
Tugas Anda:
Buatlah ${input.count} soal dengan tipe "${input.question_type}" untuk:
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

${isJavanese ? `ATURAN KHUSUS BAHASA JAWA (AKSARA JAWA):
1. Jika soal menanyakan tentang transliterasi, WAJIB sertakan teks dalam Unicode AKSARA JAWA (Contoh: ꦲꦏꦱꦫꦗꦧ).
2. Gunakan penulisan Aksara Jawa yang benar sesuai paugeran Sriwedari (sandhangan, pasangan, dll).
3. Campurkan penulisan Latin dan Aksara Jawa di kolom 'question' atau 'options' untuk variasi soal.` : ''}

ATURAN PENULISAN MATEMATIKA/SAINS (SANGAT PENTING):
1. WAJIB menggunakan LaTeX valid.
2. Gunakan \\( ... \\) untuk rumus di dalam kalimat (inline).
3. Gunakan \\[ ... \\] untuk rumus di baris tersendiri (block).
4. JANGAN PERNAH melewatkan backslash (\\) untuk perintah seperti \\frac, \\times, \\sqrt, \\cap, \\cup, dll.

ATURAN KHUSUS TIPIKAL SOAL:
1. MENJODOHKAN (matching):
   - Field 'question' WAJIB berisi instruksi diikuti daftar pernyataan (list) yang harus dijodohkan, masing-masing di baris baru dan diberi nomor (1., 2., 3., dst).
   - Field 'options' berisi pilihan jawaban (A, B, C, dst) yang menjadi pasangan dari pernyataan tersebut.
   - Field 'answer' berisi pemetaan yang benar, contoh: "1-B, 2-A, 3-C".

Output harus berupa JSON valid sesuai skema.` }
    ]
  });

  const result = response.output;
  if (!result) throw new Error("Gagal menghasilkan soal. Periksa API Key Anda.");
  return result;
}
