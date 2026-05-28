'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan Kisi-kisi Soal otomatis.
 * Memetakan daftar butir soal menjadi matriks kurikulum (CP, Indikator, Level Kognitif).
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';

const KisiKisiInputSchema = z.object({
  subject: z.string().describe('Mata pelajaran'),
  classLevel: z.string().describe('Tingkat kelas'),
  examType: z.string().describe('Jenis ujian (PH, PTS, PAS, dll)'),
  questions: z.array(z.object({
    sort_order: z.number(),
    question_text: z.string(),
    question_type: z.string(),
    topic: z.string(),
    cognitive_level: z.string().optional(),
    difficulty: z.string().optional(),
  })).describe('Daftar butir soal yang ada dalam naskah'),
});

export type KisiKisiInput = z.infer<typeof KisiKisiInputSchema>;

const KisiKisiOutputSchema = z.object({
  title: z.string().describe('Judul dokumen kisi-kisi'),
  content: z.string().describe('Konten tabel kisi-kisi dalam format Markdown'),
});

export type KisiKisiOutput = z.infer<typeof KisiKisiOutputSchema>;

export async function generateKisiKisi(input: KisiKisiInput): Promise<KisiKisiOutput> {
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

  const selectedModel = profile.ai_model || 'gemini-2.5-flash';

  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
    model: googleAI.model(selectedModel),
  });

  const response = await ai.generate({
    output: { schema: KisiKisiOutputSchema },
    prompt: `Anda adalah pakar evaluasi pendidikan di Indonesia yang sangat ahli dalam menyusun Kisi-kisi Instrumen Penilaian.

Tugas Anda adalah membuat "Kisi-kisi Soal" yang sistematis berdasarkan daftar soal berikut:

DATA NASKAH:
- Mata Pelajaran: ${input.subject}
- Kelas: ${input.classLevel}
- Jenis Ujian: ${input.examType}

BUTIR SOAL:
${input.questions.map(q => `No ${q.sort_order}. [Topik: ${q.topic}] Teks: ${q.question_text.substring(0, 150)}...`).join('\n')}

ATURAN PENULISAN:
1. FORMAT OUTPUT: Wajib berupa TABEL Markdown yang rapi.
2. KOLOM TABEL: No, Lingkup Materi/Elemen, Capaian Pembelajaran (CP), Indikator Soal, Level Kognitif (L1/L2/L3), Bentuk Soal, dan No. Soal.
3. KONSISTENSI: Pastikan No. Soal dalam tabel cocok persis dengan urutan butir soal yang diberikan.
4. INDIKATOR: Buatlah indikator soal yang spesifik dan operasional (misal: "Disajikan gambar, siswa dapat menentukan...").
5. LEVEL KOGNITIF: Petakan soal ke L1 (Pemahaman), L2 (Aplikasi), atau L3 (Penalaran/HOTS) secara akurat.

Gunakan bahasa yang sangat formal dan standar kedinasan.`,
  });

  const result = response.output;
  if (!result) throw new Error("Gagal merumuskan kisi-kisi. Periksa kuota API Key Anda.");
  return result;
}
