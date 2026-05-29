'use server';
/**
 * @fileOverview Flow Genkit untuk Deteksi LJK (Vision Only) - V69.0.
 * Gemini hanya bertugas sebagai scanner visual untuk mengubah bulatan menjadi JSON.
 * Logika koreksi dipindahkan ke Server Action untuk akurasi maksimal.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';

const CorrectExamInputSchema = z.object({
  photoDataUri: z.string().describe("Data URI foto LJK (Base64)")
});

export type CorrectExamInput = z.infer<typeof CorrectExamInputSchema>;

const CorrectExamOutputSchema = z.object({
  detectedNis: z.string().describe("NIS 5 digit yang terdeteksi dari bulatan"),
  detectedAnswers: z.array(z.object({
    questionNum: z.number().describe("Nomor soal"),
    studentChoice: z.string().describe("Huruf yang dihitamkan (A/B/C/D/E atau B/S)")
  })).describe("Daftar jawaban mentah hasil deteksi visual"),
  analysis: z.string().describe("Catatan kualitas foto (gelap, miring, dsb)")
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
    throw new Error("API Key Gemini diperlukan.");
  }

  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
    model: googleAI.model('gemini-2.5-flash-image'),
  });

  const response = await ai.generate({
    output: { schema: CorrectExamOutputSchema },
    prompt: [
        { media: { url: input.photoDataUri, contentType: 'image/jpeg' } },
        { text: `Act as a high-precision LJK/OMR Scanner.
Your ONLY task is to convert the visual marks into JSON.

1. Detect the 4 corner squares to align the perspective.
2. EXTRACT 5-digit NIS: Look at the grid on the right. Identify which digit (0-9) is filled in each of the 5 columns.
3. DETECT ANSWERS: Scan all numbered question rows. Identify the filled bubble (A-E or B-S).
4. If multiple bubbles are filled in one row, mark studentChoice as "MULTIPLE".
5. If no bubble is filled, mark studentChoice as "EMPTY".

Return ONLY the detected data. Do NOT perform any scoring.` }
    ]
  });

  const result = response.output;
  if (!result) throw new Error("AI gagal membaca gambar. Pastikan 4 kotak di pojok terlihat jelas.");
  
  return result;
}
