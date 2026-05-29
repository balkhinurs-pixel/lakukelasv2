'use server';
/**
 * @fileOverview Flow Genkit untuk Koreksi LJK (OMR Vision) - V58.0 Optimized.
 * Mendeteksi bulatan NIS dan Jawaban Siswa dari foto LJK Baku LakuKelas.
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
        { text: `Anda adalah mesin OMR (Optical Mark Recognition) tingkat tinggi berbasis Vision AI.
Tugas Anda adalah memeriksa Lembar Jawab Komputer (LJK) Standard LakuKelas ini secara presisi.

KONTEKS LAYOUT LJK (V57.0):
1. ANCHOR POINTS: Ada 4 kotak hitam solid di setiap pojok kertas. Gunakan kotak ini untuk kalibrasi koordinat dan koreksi kemiringan (perspective warp).
2. KOLOM NIS: Terletak di sisi kanan atas (Blok C). Berisi 5 kolom, masing-masing kolom memiliki bulatan angka 0-9. Deteksi angka mana yang dihitamkan di setiap kolom untuk mendapatkan NIS siswa.
3. BLOK JAWABAN:
   - Jawaban dikelompokkan berdasarkan tipe soal (Pilihan Ganda, Benar/Salah, Menjodohkan).
   - Penomoran soal tetap berlanjut secara sekuensial (1, 2, 3, dst) meskipun berada di blok berbeda.
   - Pilihan Ganda: Bulatan A-E.
   - Benar/Salah: Bulatan B-S.
   - Menjodohkan: Siswa menulis teks di dalam kotak bergaris putus-putus.

KUNCI JAWABAN REFERENSI:
${input.correctAnswers.map(k => `No ${k.sort_order} [Tipe: ${k.question_type}]: ${k.correct_answer}`).join('\n')}

INSTRUKSI ANALISIS:
1. DETEKSI NIS: Ambil 5 digit dari kolom NIS di kanan atas. Jika kosong atau tidak terbaca, laporkan di analysis.
2. DETEKSI JAWABAN: Untuk setiap nomor soal, cari bulatan (atau teks di blok Menjodohkan) yang paling gelap/diisi.
3. PERHITUNGAN SKOR: Bandingkan jawaban terdeteksi dengan KUNCI JAWABAN. Hitung skor total dalam skala 0-100.
4. VALIDASI: Jika ada nomor yang dicoret atau diisi lebih dari satu bulatan, anggap salah.

Berikan hasil dalam JSON yang sangat akurat. Field analysis harus berisi info jika ada kendala kualitas gambar (blur/miring).` }
    ]
  });

  const result = response.output;
  if (!result) throw new Error("AI gagal membaca LJK. Pastikan foto jelas, tegak lurus, dan 4 kotak hitam di pojok terlihat.");
  
  return result;
}
