'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan ilustrasi soal menggunakan Gemini 2.5 Flash Image.
 * Menggunakan model multimodal untuk efisiensi kuota gratis di Google AI Studio.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';

const GenerateImageInputSchema = z.object({
  questionText: z.string().describe('Teks pertanyaan yang akan diilustrasikan'),
  subject: z.string().describe('Mata pelajaran'),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('Data URI gambar yang dihasilkan (Base64)'),
});

export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateQuestionImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesi berakhir.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('gemini_api_key')
    .eq('id', user.id)
    .single();

  if (!profile?.gemini_api_key) {
    throw new Error("API Key Gemini diperlukan di Pengaturan.");
  }

  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
  });

  // Generate Image using Gemini 2.5 Flash Image (Nano-Banana)
  // Penting: Wajib menyertakan TEXT dan IMAGE dalam responseModalities
  const response = await ai.generate({
    model: googleAI.model('gemini-2.5-flash-image'),
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
    prompt: `Act as an educational illustrator. Generate a professional, clean 2D 
    illustration for a school exam question. 
    
    Topic: ${input.questionText}. 
    Subject: ${input.subject}. 
    
    Style: Minimalist educational drawing, suitable for print on A4 paper, bright colors, 
    no text inside the image, simple for students to understand.`,
  });

  const media = response.media;
  if (!media || !media.url) {
    throw new Error("AI gagal menghasilkan gambar. Periksa kuota Gemini 2.5 Anda.");
  }

  return { imageUrl: media.url };
}
