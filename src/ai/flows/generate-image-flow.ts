
'use server';
/**
 * @fileOverview Flow Genkit untuk pembuatan ilustrasi soal menggunakan Gemini 2.5 Flash Image.
 * Dioptimalkan untuk stabilitas kuota Free Tier Google AI Studio.
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

  try {
    // Generate Image using Gemini 2.5 Flash Image
    // Dioptimalkan: Menggunakan model flash yang paling ringan untuk efisiensi kuota
    const response = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-image'),
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      },
      prompt: `Act as an educational illustrator. Create a simple, clear, professional 2D line-art 
      illustration for a school question about: ${input.topic || input.questionText}. 
      Subject: ${input.subject}. 
      Style: Minimalist, black and white or soft colors, educational, no text, clean for printing.`,
    });

    const media = response.media;
    if (!media || !media.url) {
      throw new Error("AI tidak mengembalikan gambar. Coba persingkat teks soal.");
    }

    return { imageUrl: media.url };
  } catch (error: any) {
    // Tangani error kuota secara spesifik
    if (error.message?.includes('429')) {
      throw new Error("Batas permintaan gratis tercapai. Harap tunggu 1 menit sebelum mencoba lagi.");
    }
    throw error;
  }
}
