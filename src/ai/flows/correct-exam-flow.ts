'use server';
/**
 * @fileOverview Flow Genkit untuk Koreksi LJK (OMR Vision).
 * Mendeteksi bulatan NIS dan Jawaban Siswa dari foto LJK Baku.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';

const CorrectExamInputSchema = z.object({
  photoDataUri: z.string().describe("Data URI foto LJK (Base64)"),
  naskahId: z.string().describe("ID naskah sebagai referensi kunci jawaban"),
  correctAnswers: z.array(z.object({
    sort_order: z.number(),
    correct_answer: z.string(),
    question_type: z.string()
  })).describe("Daftar kunci jawaban dari database")
});

export type CorrectExamInput = z.infer<typeof CorrectExamInputSchema>;

const CorrectExamOutputSchema = z.object({
  detectedNis: z.string().describe("Nomor NIS yang terdeteksi dari bulatan LJK"),
  studentAnswers: z.array(z.object({
    questionNum: z.number(),
    studentChoice: z.string(),
    isCorrect: z.boolean(),
    correctValue: z.string()
  })).describe("Hasil deteksi jawaban per nomor"),
  totalScore: z.number().describe("Skor akhir (0-100)"),
  analysis: z.string().describe("Catatan singkat AI mengenai kualitas scan atau kesalahan umum")
});

export type CorrectExamOutput = z.infer<typeof CorrectExamOutputSchema>;

export async function correctExam(input: CorrectExamInput): Promise<CorrectExamOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesi berakhir.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('gemini_api_key, ai_model')
    .eq('id', user.id)
    .single();

  if (!profile?.gemini_api_key) {
    throw new Error("API Key Gemini diperlukan untuk fitur Vision AI.");
  }

  // Gunakan model Flash 2.5 karena paling cepat dan akurat untuk tugas Vision OMR
  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
    model: googleAI.model('gemini-2.5-flash-image'),
  });

  const response = await ai.generate({
    output: { schema: CorrectExamOutputSchema },
    prompt: [
        { media: { url: input.photoDataUri, contentType: 'image/jpeg' } },
        { text: `Anda adalah mesin OMR (Optical Mark Recognition) tingkat tinggi.
Tugas Anda adalah memeriksa Lembar Jawab Komputer (LJK) ini.

KUNCI JAWABAN REFERENSI:
${input.correctAnswers.map(k => `No ${k.sort_order}: ${k.correct_answer}`).join(', ')}

INSTRUKSI DETEKSI:
1. IDENTIFIKASI NIS: Cari blok "KOLOM NIS" di sisi kanan atas. Deteksi digit mana yang dibulatkan hitam. Gabungkan menjadi satu string nomor.
2. IDENTIFIKASI JAWABAN: Periksa kolom jawaban di bawah. Cari bulatan (A, B, C, D, E) atau (B, S) yang paling gelap.
3. ALIGNMENT: Gunakan 4 kotak hitam (Anchor Points) di setiap pojok kertas untuk menstabilkan perspektif gambar.
4. PERHITUNGAN SKOR: Bandingkan jawaban terdeteksi dengan kunci jawaban yang diberikan. Hitung skor dalam skala 0-100.
5. ANALISIS: Jika gambar buram atau bulatan tidak jelas, berikan catatan di field analysis.

Pastikan hasil deteksi sangat akurat.` }
    ]
  });

  const result = response.output;
  if (!result) throw new Error("AI gagal membaca LJK. Pastikan foto jelas dan cahaya cukup.");
  
  return result;
}
