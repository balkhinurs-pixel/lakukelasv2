'use server';
/**
 * @fileOverview Flow Genkit untuk Deteksi LJK V130 (QR Identity Support).
 * Gemini mendeteksi identitas siswa via QR Code atau teks di bagian atas LJK.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';

const CorrectExamInputSchema = z.object({
  photoDataUri: z.string().describe("Data URI foto LJK (Base64)")
});

export type CorrectExamInput = z.infer<typeof CorrectExamInputSchema>;

const CorrectExamOutputSchema = z.object({
  detectedNis: z.string().describe("NIS siswa yang ditemukan dari QR Code atau teks identitas di bagian atas"),
  detectedStudentName: z.string().describe("Nama siswa yang tertulis di kertas"),
  analysis: z.string().describe("Catatan kualitas scan")
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
        { text: `Act as a Professional Exam Proctor. 
Your primary task is to identify the STUDENT IDENTITY from the provided image.

1. Find the QR Code on the left side. Decode it to get the NIS and Student Name.
2. If QR is unreadable, read the printed text next to "NAMA LENGKAP" and "NIS".
3. Return the detected NIS and full name.

Do NOT scan the bubbles, only identify who owns this paper.` }
    ]
  });

  const result = response.output;
  if (!result) throw new Error("AI gagal mengidentifikasi siswa. Pastikan bagian atas LJK terlihat jelas.");
  
  return result;
}