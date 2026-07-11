'use server';
/**
 * @fileOverview Flow Genkit untuk Ringkasan Materi.
 * Versi 1.x dengan LaTeX & Aksara Jawa support.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';
import { LAKUKELAS_SYSTEM_PROMPT } from '../system-prompt';

const MaterialGenerationInputSchema = z.object({
  jenjang: z.string(),
  kelas: z.string(),
  semester: z.string().optional(),
  subject: z.string(),
  topic: z.string(),
  subtopic: z.string().optional(),
  instruction: z.string().optional(),
  depth: z.enum(['dasar', 'menengah', 'mendalam']).default('menengah'),
  mediaDataUri: z.string().optional(),
  mediaMimeType: z.string().optional(),
});

export type MaterialGenerationInput = z.infer<typeof MaterialGenerationInputSchema>;

const MaterialGenerationOutputSchema = z.object({
  title: z.string(),
  content: z.string().describe('Markdown profesional dengan LaTeX'),
});

export type MaterialGenerationOutput = z.infer<typeof MaterialGenerationOutputSchema>;

export async function generateMaterial(input: MaterialGenerationInput): Promise<MaterialGenerationOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Sesi berakhir.");

  const { data: profile } = await supabase
    .from('profiles')
    .select('gemini_api_key, ai_model')
    .eq('id', user.id)
    .single();

  if (!profile?.gemini_api_key) throw new Error("API Key belum diatur.");

  const selectedModel = profile.ai_model || 'gemini-1.5-flash';
  const ai = genkit({
    plugins: [googleAI({ apiKey: profile.gemini_api_key })],
  });

  const response = await ai.generate({
    model: googleAI.model(selectedModel),
    system: LAKUKELAS_SYSTEM_PROMPT,
    output: { schema: MaterialGenerationOutputSchema },
    prompt: [
        ...(input.mediaDataUri ? [{ media: { url: input.mediaDataUri, contentType: input.mediaMimeType || 'image/jpeg' } }] : []),
        { text: `Tugas: Buat Ringkasan Materi Ajar untuk Topik: ${input.topic} (${input.subject}).
        Detail: Kelas ${input.kelas}, Kedalaman: ${input.depth}. 
        Gunakan LaTeX untuk rumus dan Bahasa Indonesia formal.` }
    ]
  });

  const result = response.output;
  if (!result) throw new Error("Gagal merangkum materi.");
  return result;
}
