'use server';
/**
 * @fileOverview Flow Genkit untuk perumusan CP & ATP.
 * Versi 1.x dengan Awareness LakuKelas.
 */

import { z, genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { createClient } from '@/lib/supabase/server';
import { LAKUKELAS_SYSTEM_PROMPT } from '../system-prompt';

const CpAtpInputSchema = z.object({
  subject: z.string(),
  phase: z.string(),
  classLevel: z.string(),
  scope: z.string(),
  additionalInfo: z.string().optional(),
});

export type CpAtpInput = z.infer<typeof CpAtpInputSchema>;

const CpAtpOutputSchema = z.object({
  title: z.string(),
  content: z.string().describe('Konten CP & ATP dalam format TABEL Markdown'),
});

export type CpAtpOutput = z.infer<typeof CpAtpOutputSchema>;

export async function generateCpAtp(input: CpAtpInput): Promise<CpAtpOutput> {
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
    output: { schema: CpAtpOutputSchema },
    prompt: `Tugas: Rumuskan Pemetaan CP & ATP untuk Mapel: ${input.subject}, Fase: ${input.phase}, Lingkup: ${input.scope}.
    Gunakan format TABEL Markdown yang standar kedinasan.`
  });

  const result = response.output;
  if (!result) throw new Error("Gagal merumuskan kurikulum.");
  return result;
}
