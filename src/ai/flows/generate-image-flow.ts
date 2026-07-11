'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan ilustrasi soal menggunakan Imagen 4.
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
    throw new Error("API Key Gemini diperlukan untuk akses Imagen.");
  }

  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
  });

  // Generate Image using Imagen 4
  const response = await ai.generate({
    model: 'googleai/imagen-4.0-fast-generate-001',
    prompt: `Educational illustration for a school question about: ${input.questionText}. 
    Subject: ${input.subject}. 
    Style: Professional clean 2D educational illustration, bright lighting, high quality, suitable for exam paper. 
    Avoid text in the image.`,
  });

  const media = response.media;
  if (!media || !media.url) {
    throw new Error("AI gagal menghasilkan gambar. Periksa kuota Imagen Anda.");
  }

  return { imageUrl: media.url };
}
